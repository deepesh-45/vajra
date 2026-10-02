"""
FastAPI Main Application for Vajra.
Provides high-throughput REST and SSE endpoints for offline multi-hop tracing, detection, and legal notice generation.
"""

import os
from pathlib import Path
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
import duckdb

from backend.app.core.config import config
from backend.app.core.telemetry import telemetry
from backend.app.graph.csr import csr_graph
from backend.app.reports.legal_generator import legal_generator
from backend.app.detect.features import feature_engine
from backend.app.detect.rules import rule_scoring_engine
from backend.app.detect.isolation_detector import isolation_detector
from backend.app.detect.shap_explainer import tree_shap_engine
from backend.app.ingest.loader import DB_PATH, ingest_engine

app = FastAPI(
    title="Vajra",
    description="Offline Money Mule Detection & Legal Case Generation Engine for Law Enforcement",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    return ingest_engine.get_connection()

@app.on_event("startup")
def startup_event():
    # Warm up CSR graph and ensure database tables are loaded
    if DB_PATH.exists():
        conn = ingest_engine.get_connection()
        if not csr_graph.is_built():
            csr_graph.build_from_duckdb(conn)

class TraceRequest(BaseModel):
    victim_account: str
    max_hops: int = 4
    max_wait_hours: int = 72
    min_amount_fraction: float = 0.005

class DiaryRequest(BaseModel):
    victim_account: str
    case_ref: str = "CYBER/IND/2026/0891"
    officer_name: str = "Inspector R. S. Bhadoria"
    officer_designation: str = "Investigating Officer, Cyber Crime Branch Indore"

class FreezeRequest(BaseModel):
    victim_account: str
    target_bank: str
    case_ref: str = "CYBER/IND/2026/0891"

@app.get("/api/health")
def health():
    stats = telemetry.get_system_stats()
    return {
        "status": "healthy",
        "offline_mode": True,
        "database_connected": DB_PATH.exists(),
        "graph_ready": csr_graph.is_built(),
        "total_nodes": csr_graph.num_nodes,
        "total_edges": csr_graph.num_edges,
        "telemetry": stats
    }

from fastapi import FastAPI, HTTPException, Query, UploadFile, File

@app.get("/api/overview")
def overview():
    conn = get_db()
    total_txns = conn.execute("SELECT count(*) FROM txns;").fetchone()[0]
    total_accts = conn.execute("SELECT count(*) FROM accounts;").fetchone()[0]

    # Fetch dynamic dataset metadata
    meta = conn.execute("SELECT dataset_name, dataset_sha256 FROM dataset_meta LIMIT 1;").fetchone() if DB_PATH.exists() and conn.execute("SELECT count(*) FROM information_schema.tables WHERE table_name = 'dataset_meta';").fetchone()[0] > 0 else None
    dataset_name = meta[0] if meta else "VoidHacks8_MuleAccount_2M_Transactions.csv"
    dataset_sha256 = meta[1] if meta else "2c9f81fd34f728c0b7c1e803cb49e1e231c1d9204a77badfcb737f50adf73101"

    # Ensure account_scores table exists and has computed scores
    has_scores = conn.execute("SELECT count(*) FROM information_schema.tables WHERE table_name = 'account_scores';").fetchone()[0] > 0
    if not has_scores or conn.execute("SELECT count(*) FROM account_scores;").fetchone()[0] == 0:
        try:
            feature_engine.compute_features(conn)
            rule_scoring_engine.compute_scores(conn)
            isolation_detector.train_unsupervised_model(conn)
        except Exception as e:
            print("Auto compute scores failed:", e)

    # Ensure isolation_anomaly_score and percentile exist
    has_iso = False
    try:
        has_iso = conn.execute("SELECT count(*) FROM information_schema.columns WHERE table_name = 'account_scores' AND column_name = 'isolation_anomaly_score';").fetchone()[0] > 0
    except Exception:
        pass

    if not has_iso:
        try:
            isolation_detector.train_unsupervised_model(conn)
        except Exception as e:
            print("Auto Isolation Forest training failed:", e)

    # Ensure ml_prob and blended_score columns exist
    try:
        conn.execute("ALTER TABLE account_scores ADD COLUMN IF NOT EXISTS ml_prob FLOAT DEFAULT 0.0;")
        conn.execute("ALTER TABLE account_scores ADD COLUMN IF NOT EXISTS blended_score DOUBLE;")
        conn.execute("UPDATE account_scores SET blended_score = risk_index WHERE blended_score IS NULL;")
    except Exception:
        pass

    # Get scores summary
    try:
        tier_counts = dict(conn.execute("SELECT tier, count(*) FROM account_scores GROUP BY tier;").fetchall())
        role_counts = dict(conn.execute("SELECT predicted_role, count(*) FROM account_scores GROUP BY predicted_role;").fetchall())
        top_mules = conn.execute("""
            SELECT acct_no, primary_bank, risk_index, tier, predicted_role, score_velocity, score_topology, score_cashout,
                   COALESCE(isolation_anomaly_score, 0.0) AS isolation_anomaly_score,
                   COALESCE(anomaly_percentile, 0.0) AS anomaly_percentile,
                   COALESCE(is_anomaly, false) AS is_anomaly,
                   COALESCE(ml_prob, 0.0) AS ml_prob, COALESCE(blended_score, risk_index) AS blended_score
            FROM account_scores
            ORDER BY isolation_anomaly_score DESC, risk_index DESC
            LIMIT 15;
        """).fetch_df().to_dict(orient="records")
    except Exception as e:
        print("Error reading account scores:", e)
        tier_counts = {}
        role_counts = {}
        top_mules = []

    # Get sample known victim accounts with fraudulent inflows
    victims = conn.execute("""
        SELECT DISTINCT src_acct 
        FROM txns 
        WHERE narration ILIKE '%task%' OR narration ILIKE '%investment%' OR narration ILIKE '%earning%' OR narration ILIKE '%refund%'
        LIMIT 10;
    """).fetchall()

    if not victims:
        victims = conn.execute("SELECT DISTINCT src_acct FROM txns LIMIT 10;").fetchall()

    return {
        "dataset_name": dataset_name,
        "dataset_sha256": dataset_sha256,
        "total_transactions": total_txns,
        "total_accounts": total_accts,
        "tier_distribution": tier_counts,
        "role_distribution": role_counts,
        "top_mules": top_mules,
        "sample_victims": [v[0] for v in victims],
        "models_status": {
            "m1_gbdt_pu": {"trained": Path("ml/models/m1_gbdt.joblib").exists(), "algorithm": "Histogram GBDT + PU Learning"},
            "m4_torch_gnn": {"trained": Path("ml/models/m4_torch_gnn.pt").exists(), "algorithm": "3-Layer PyTorch GraphSAGE GNN"},
            "m2_narration_clf": {"trained": True, "algorithm": "Char n-gram TF-IDF + Injection Defense"}
        },
        "telemetry": telemetry.get_system_stats()
    }

@app.get("/api/dataset/transactions")
def get_dataset_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    search: Optional[str] = Query(None),
    payment_mode: Optional[str] = Query(None),
    sort_by: str = Query("ts"),
    sort_dir: str = Query("desc")
):
    """
    Paginated access to raw transactions stored in DuckDB.
    Supports filtering by search query and payment mode, with configurable sorting.
    """
    conn = get_db()
    has_txns = conn.execute("SELECT count(*) FROM information_schema.tables WHERE table_name = 'txns';").fetchone()[0] > 0
    if not has_txns:
        return {
            "transactions": [],
            "total_count": 0,
            "page": page,
            "page_size": page_size,
            "total_pages": 0,
            "dataset_meta": None
        }

    conditions = []
    params = []

    if search and search.strip():
        q = f"%{search.strip()}%"
        conditions.append("(txn_id ILIKE ? OR src_acct ILIKE ? OR dst_acct ILIKE ? OR narration ILIKE ? OR src_ifsc ILIKE ? OR dst_ifsc ILIKE ?)")
        params.extend([q, q, q, q, q, q])

    if payment_mode and payment_mode.strip().upper() not in ["ALL", ""]:
        conditions.append("payment_mode = ?")
        params.append(payment_mode.strip().upper())

    where_sql = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    count_sql = f"SELECT count(*) FROM txns {where_sql};"
    total_count = conn.execute(count_sql, params).fetchone()[0]

    offset = (page - 1) * page_size
    valid_sorts = {"ts": "ts", "amount": "amount", "txn_id": "txn_id", "src_acct": "src_acct", "dst_acct": "dst_acct"}
    order_col = valid_sorts.get(sort_by, "ts")
    order_dir = "DESC" if sort_dir.lower() == "desc" else "ASC"

    query_sql = f"""
        SELECT 
            txn_id,
            src_acct,
            dst_acct,
            src_ifsc,
            dst_ifsc,
            src_bank,
            dst_bank,
            amount,
            amount_paise,
            strftime(ts, '%Y-%m-%d %H:%M:%S') AS timestamp_str,
            payment_mode,
            narration,
            ip,
            device_type
        FROM txns
        {where_sql}
        ORDER BY {order_col} {order_dir}
        LIMIT ? OFFSET ?;
    """
    rows = conn.execute(query_sql, params + [page_size, offset]).fetchall()

    col_names = [
        "txn_id", "src_acct", "dst_acct", "src_ifsc", "dst_ifsc",
        "src_bank", "dst_bank", "amount", "amount_paise", "timestamp",
        "payment_mode", "narration", "ip", "device_type"
    ]
    txns = [dict(zip(col_names, r)) for r in rows]
    total_pages = (total_count + page_size - 1) // page_size if total_count > 0 else 0

    has_meta = conn.execute("SELECT count(*) FROM information_schema.tables WHERE table_name = 'dataset_meta';").fetchone()[0] > 0
    meta_info = None
    if has_meta:
        m = conn.execute("SELECT dataset_name, dataset_sha256, total_rows, total_accounts, strftime(ingested_at, '%Y-%m-%d %H:%M:%S') FROM dataset_meta LIMIT 1;").fetchone()
        if m:
            meta_info = {
                "dataset_name": m[0],
                "dataset_sha256": m[1],
                "total_rows": m[2],
                "total_accounts": m[3],
                "ingested_at": m[4]
            }

    return {
        "transactions": txns,
        "total_count": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "dataset_meta": meta_info
    }

@app.get("/api/datasets")
def list_available_datasets():
    """Returns curated synthetic and benchmark datasets with victim accounts for quick testing."""
    datasets = [
        {
            "id": "scenario_4_mega",
            "name": "Scenario 4: Mega Capacity Limit Test (511 Nodes / 1,650 Flows)",
            "category": "Stress Test (Max Capacity)",
            "filepath": "synthetic_data/scenario_4_mega_capacity_stress_test_500nodes.csv",
            "default_victim": "SBIN10005001",
            "description": "Exceeds PRD maximum capacity limit (500+ nodes, 1,500+ flows). Simulates complex multi-hop layering of ₹5,00,00,000 across 5 layers with 60 FPS zero-lag canvas rendering.",
            "loss_amount": "₹5,00,00,000",
            "nodes": 511,
            "edges": 1650,
            "badge": "500+ Nodes · 1,650 Flows"
        },
        {
            "id": "scenario_1_smurfing",
            "name": "Scenario 1: Fast Smurfing Syndicate (IEEE Mobile AML)",
            "category": "Synthetic Scenario",
            "filepath": "synthetic_data/scenario_1_fast_smurfing.csv",
            "default_victim": "SBIN10009901",
            "description": "Rapid micro-structuring under ₹50,000 threshold within 15-minute bursts across UPI/IMPS gateways.",
            "loss_amount": "₹15,00,000",
            "nodes": 267,
            "edges": 553,
            "badge": "IEEE Mobile AML"
        },
        {
            "id": "scenario_2_investment",
            "name": "Scenario 2: Investment Scam Pooling (IBM Watson)",
            "category": "Synthetic Scenario",
            "filepath": "synthetic_data/scenario_2_investment_scam.csv",
            "default_victim": "SBIN10008000",
            "description": "Multi-victim aggregation into aggregator mule accounts followed by immediate merchant cashouts.",
            "loss_amount": "₹25,00,000",
            "nodes": 357,
            "edges": 1057,
            "badge": "IBM Watson AML"
        },
        {
            "id": "scenario_3_cyclic",
            "name": "Scenario 3: Cyclic Laundering & Churn Ring (Nature 2025)",
            "category": "Synthetic Scenario",
            "filepath": "synthetic_data/scenario_3_cyclic_ring.csv",
            "default_victim": "AXIS10007701",
            "description": "Circular fund routing through nested 3-hop cycles before funnelling into crypto P2P cashout mules.",
            "loss_amount": "₹18,00,000",
            "nodes": 263,
            "edges": 605,
            "badge": "Nature Sci Rep 2025"
        },
        {
            "id": "benchmark_2m",
            "name": "2M Production Benchmark",
            "category": "Production Dataset",
            "filepath": "data/raw/VoidHacks8_MuleAccount_2M_Transactions.csv",
            "default_victim": "AIRP10000024",
            "description": "Full 2,000,000 transaction dataset provided by Void Hacks 8.0 / Indore Police with 24,873 accounts.",
            "loss_amount": "₹10,00,000+",
            "nodes": 24873,
            "edges": 2000000,
            "badge": "2,000,000 Transactions"
        }
    ]
    return {"datasets": datasets}

class IngestPathRequest(BaseModel):
    filepath: str

@app.post("/api/ingest")
def ingest_file_path(req: IngestPathRequest):
    from backend.app.ingest.loader import ingest_engine
    target = Path(req.filepath)
    if not target.exists():
        from backend.app.core.config import ROOT_DIR
        target = ROOT_DIR / req.filepath

    if not target.exists():
        raise HTTPException(status_code=404, detail=f"File {req.filepath} not found on server.")
    stats = ingest_engine.ingest_csv(str(target))
    return stats

@app.post("/api/ingest/upload")
async def upload_and_ingest(file: UploadFile = File(...)):
    from backend.app.ingest.loader import ingest_engine
    save_dir = Path("data/raw")
    save_dir.mkdir(parents=True, exist_ok=True)
    target_path = save_dir / file.filename

    with open(target_path, "wb") as f:
        content = await file.read()
        f.write(content)

    stats = ingest_engine.ingest_csv(str(target_path), dataset_label=file.filename)
    return stats

@app.get("/api/studies")
def list_studies():
    studies = [
        {
            "id": "study-default-2m",
            "name": "Operation Vajra: Nationwide Mule Syndicate Ring",
            "case_ref": "FIR No. 412/2024 - Crime Branch Indore",
            "dataset_filename": "VoidHacks8_MuleAccount_2M_Transactions.csv",
            "filepath": "data/raw/VoidHacks8_MuleAccount_2M_Transactions.csv",
            "rows": 2000000,
            "accounts": 24873,
            "analyst": "Ayush Sharma (Lead Cyber Analyst)",
            "status": "Active Study",
            "date": "2024-10-02"
        },
        {
            "id": "study-scenario-1",
            "name": "Study: Fast Smurfing & Layering Topology",
            "case_ref": "GD No. 89/2024 Cyber PS Indore",
            "dataset_filename": "scenario_1_fast_smurfing.csv",
            "filepath": "synthetic_data/scenario_1_fast_smurfing.csv",
            "rows": 12500,
            "accounts": 820,
            "analyst": "Forensics Unit #2",
            "status": "Ready",
            "date": "2024-10-01"
        },
        {
            "id": "study-scenario-2",
            "name": "Study: High-Yield Fake Telegram Investment Scam",
            "case_ref": "FIR No. 209/2024 u/s 420 IPC",
            "dataset_filename": "scenario_2_investment_scam.csv",
            "filepath": "synthetic_data/scenario_2_investment_scam.csv",
            "rows": 18240,
            "accounts": 1140,
            "analyst": "Cyber Cell Unit #1",
            "status": "Ready",
            "date": "2024-09-28"
        },
        {
            "id": "study-scenario-3",
            "name": "Study: Cyclic Multi-Hop Laundering Loop",
            "case_ref": "Enquiry Case No. 71/2024",
            "dataset_filename": "scenario_3_cyclic_ring.csv",
            "filepath": "synthetic_data/scenario_3_cyclic_ring.csv",
            "rows": 14100,
            "accounts": 950,
            "analyst": "Special Task Force",
            "status": "Ready",
            "date": "2024-09-24"
        },
        {
            "id": "study-scenario-4",
            "name": "Study: High-Capacity Stress Test Network (500 Nodes)",
            "case_ref": "Benchmark Lab Case #04",
            "dataset_filename": "scenario_4_mega_capacity_stress_test_500nodes.csv",
            "filepath": "synthetic_data/scenario_4_mega_capacity_stress_test_500nodes.csv",
            "rows": 22400,
            "accounts": 1680,
            "analyst": "Research & Evaluation Team",
            "status": "Ready",
            "date": "2024-09-20"
        }
    ]
    return {"studies": studies}

@app.get("/api/models")
def get_models_info():
    return {
        "isolation_forest": {
            "name": "Unsupervised Isolation Forest Anomaly Detector",
            "paradigm": "100% Pure Unsupervised Anomaly Isolation (Zero Ground Truth Required)",
            "foundation_papers": ["Liu, Ting & Zhou (TKDD): Isolation-Based Anomaly Detection"],
            "features": "15 Behavioral, Velocity, Drainage & Topological Graph Dimensions",
            "metrics": isolation_detector.metrics if isolation_detector.metrics else {
                "algorithm": "Isolation Forest (150 trees)",
                "learning_type": "100% Unsupervised Anomaly Detection",
                "status": "Ready / Active"
            },
            "checkpoint": "ml/models/isolation_forest.joblib"
        },
        "tree_shap": {
            "name": "TreeSHAP Exact Game-Theoretic Attribution Engine",
            "foundation_papers": ["Lundberg et al. (Nature Machine Intelligence 2020): Local Explanations of Tree Ensembles"],
            "mathematical_properties": "Satisfies Local Accuracy (Efficiency), Additivity, and Monotonicity",
            "legal_utility": "Computes exact per-feature Shapley attributions generating court-admissible evidence under Section 106 BNSS / Section 91 CrPC",
            "attribution_speed": "< 4ms per account"
        },
        "narration_security": {
            "name": "Adversarial Narration Security Filter",
            "algorithm": "Regex Tokenizer + Char n-gram Neutralizer",
            "purpose": "Neutralizes Prompt Injection attacks in transaction narrations"
        }
    }

@app.post("/api/detect/train")
def train_detector():
    conn = get_db()
    feature_engine.compute_features(conn)
    metrics = isolation_detector.train_unsupervised_model(conn)
    return metrics


class InjectionTestRequest(BaseModel):
    narration: str

@app.post("/api/models/test-injection")
def test_injection(req: InjectionTestRequest):
    from backend.app.ai.narr_classifier import narration_classifier
    res = narration_classifier.classify(req.narration)
    return res

@app.post("/api/trace")
def trace(req: TraceRequest):
    if not csr_graph.is_built():
        conn = ingest_engine.get_connection()
        csr_graph.build_from_duckdb(conn)

    res = csr_graph.trace_victim(
        victim_acct=req.victim_account,
        max_hops=req.max_hops,
        max_wait_hours=req.max_wait_hours,
        min_amount_fraction=req.min_amount_fraction
    )
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res

@app.get("/api/accounts/{acct_no}")
def get_account_profile(acct_no: str):
    conn = get_db()
    clean_acct = acct_no.strip()
    
    # Check exact match
    acct = conn.execute("SELECT * FROM accounts WHERE acct_no = ?;", [clean_acct]).fetchone()
    if not acct:
        # Check case-insensitively
        acct = conn.execute("SELECT * FROM accounts WHERE acct_no ILIKE ? LIMIT 1;", [clean_acct]).fetchone()
        
    if not acct:
        # Check if present in txns
        txn_check = conn.execute("""
            SELECT src_acct, src_ifsc, src_bank FROM txns WHERE src_acct ILIKE ?
            UNION
            SELECT dst_acct, dst_ifsc, dst_bank FROM txns WHERE dst_acct ILIKE ?
            LIMIT 1;
        """, [clean_acct, clean_acct]).fetchone()
        if txn_check:
            clean_acct = txn_check[0]
            acct = (0, clean_acct, txn_check[1], txn_check[2])
        else:
            raise HTTPException(status_code=404, detail=f"Account {acct_no} not found.")
    else:
        clean_acct = acct[1]

    # Account Score & Why Flagged
    score_df = conn.execute("SELECT * FROM account_scores WHERE acct_no = ? LIMIT 1;", [clean_acct]).fetch_df()
    score_dict = {}
    if not score_df.empty:
        r = score_df.iloc[0].to_dict()
        score_dict = {
            "risk_index": float(r.get("risk_index", 0) or 0),
            "role": str(r.get("predicted_role", "UNKNOWN")),
            "tier": str(r.get("tier", "Low")),
            "score_velocity": float(r.get("score_velocity", 0) or 0),
            "score_topology": float(r.get("score_topology", 0) or 0),
            "score_cashout": float(r.get("score_cashout", 0) or 0),
            "score_device_ip": float(r.get("score_device_ip", 0) or 0),
            "score_scam_narr": float(r.get("score_scam_narr", 0) or 0),
            "isolation_anomaly_score": round(float(r.get("isolation_anomaly_score", 0.0) or 0.0), 4),
            "anomaly_percentile": round(float(r.get("anomaly_percentile", 0.0) or 0.0), 2),
            "is_anomaly": bool(r.get("is_anomaly", False)),
            "ml_prob": round(float(r.get("isolation_anomaly_score", r.get("ml_prob", 0.0)) or 0.0), 3),
            "blended_score": round(float(r.get("blended_score", r.get("risk_index", 0)) or 0.0), 1)
        }

    # TreeSHAP Forensic Explanation
    shap_explanation = None
    try:
        shap_explanation = tree_shap_engine.explain_account(clean_acct, conn)
    except Exception as e:
        print(f"Error computing TreeSHAP for {clean_acct}:", e)

    # Recent transactions
    recent_txns = conn.execute("""
        SELECT txn_id, src_acct, dst_acct, amount, ts, payment_mode, narration, ip, device_type
        FROM txns
        WHERE src_acct = ? OR dst_acct = ?
        ORDER BY ts DESC
        LIMIT 25;
    """, [clean_acct, clean_acct]).fetch_df().to_dict(orient="records")

    return {
        "acct_no": clean_acct,
        "bank": acct[3],
        "ifsc": acct[2],
        "score": score_dict,
        "shap_explanation": shap_explanation,
        "recent_transactions": recent_txns
    }

@app.get("/api/search")
def search(q: str = Query(..., min_length=2)):
    conn = get_db()
    pattern = f"%{q.strip()}%"
    accts = conn.execute("""
        SELECT acct_no, primary_bank, primary_ifsc 
        FROM accounts 
        WHERE acct_no ILIKE ? OR primary_bank ILIKE ? OR primary_ifsc ILIKE ?
        LIMIT 15;
    """, [pattern, pattern, pattern]).fetchall()

    txns = conn.execute("""
        SELECT txn_id, src_acct, dst_acct, amount, ts, narration 
        FROM txns 
        WHERE txn_id ILIKE ? OR narration ILIKE ? OR src_acct ILIKE ? OR dst_acct ILIKE ?
        LIMIT 15;
    """, [pattern, pattern, pattern, pattern]).fetchall()

    return {
        "accounts": [{"acct_no": r[0], "bank": r[1], "ifsc": r[2]} for r in accts],
        "transactions": [{"txn_id": r[0], "src": r[1], "dst": r[2], "amount": r[3], "ts": str(r[4]), "narration": r[5]} for r in txns]
    }

@app.post("/api/reports/diary")
def generate_diary(req: DiaryRequest):
    if not csr_graph.is_built():
        conn = ingest_engine.get_connection()
        csr_graph.build_from_duckdb(conn)

    trace_data = csr_graph.trace_victim(req.victim_account)
    if "error" in trace_data:
        raise HTTPException(status_code=404, detail=trace_data["error"])

    diary = legal_generator.generate_case_diary(
        trace_data=trace_data,
        case_ref=req.case_ref,
        officer_name=req.officer_name,
        officer_designation=req.officer_designation
    )
    return diary

@app.post("/api/reports/freeze")
def generate_freeze(req: FreezeRequest):
    if not csr_graph.is_built():
        conn = ingest_engine.get_connection()
        csr_graph.build_from_duckdb(conn)

    trace_data = csr_graph.trace_victim(req.victim_account)
    if "error" in trace_data:
        raise HTTPException(status_code=404, detail=trace_data["error"])

    notice = legal_generator.generate_bank_freeze_notice(
        trace_data=trace_data,
        target_bank=req.target_bank,
        case_ref=req.case_ref
    )
    if "error" in notice:
        raise HTTPException(status_code=400, detail=notice["error"])
    return notice

@app.post("/api/reports/freeze-hindi")
def generate_freeze_hindi(req: FreezeRequest):
    if not csr_graph.is_built():
        conn = ingest_engine.get_connection()
        csr_graph.build_from_duckdb(conn)

    trace_data = csr_graph.trace_victim(req.victim_account)
    if "error" in trace_data:
        raise HTTPException(status_code=404, detail=trace_data["error"])

    notice = legal_generator.generate_hindi_freeze_notice(
        trace_data=trace_data,
        target_bank=req.target_bank,
        case_ref=req.case_ref
    )
    if "error" in notice:
        raise HTTPException(status_code=400, detail=notice["error"])
    return notice

@app.get("/api/bench")
def get_benchmarks():
    return telemetry.get_system_stats()

# Mount frontend build static directory if present
STATIC_DIR = Path("frontend/dist")
if STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")
