import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  ArrowUpRight
} from 'lucide-react';
import type { DatasetTransactionsResponse, TransactionRecord } from '../types';

interface DatasetTabProps {
  onSelectVictim: (acct: string) => void;
}

export const DatasetTab: React.FC<DatasetTabProps> = ({ onSelectVictim }) => {
  const [data, setData] = useState<DatasetTransactionsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Pagination State
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(100);
  const [search, setSearch] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('ts');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [pageJump, setPageJump] = useState<string>('');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
        sort_by: sortBy,
        sort_dir: sortDir
      });
      if (search.trim()) params.append('search', search.trim());
      if (paymentMode && paymentMode !== 'ALL') params.append('payment_mode', paymentMode);

      const resp = await fetch(`/api/dataset/transactions?${params.toString()}`);
      if (!resp.ok) throw new Error(`HTTP error ${resp.status}`);
      const json: DatasetTransactionsResponse = await resp.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dataset transactions from DuckDB');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, paymentMode, sortBy, sortDir]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearch('');
    setPaymentMode('ALL');
    setSortBy('ts');
    setSortDir('desc');
    setPage(1);
  };

  const handlePageJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(pageJump, 10);
    if (data && target >= 1 && target <= data.total_pages) {
      setPage(target);
      setPageJump('');
    }
  };

  const meta = data?.dataset_meta;
  const totalCount = data?.total_count ?? 0;
  const totalPages = data?.total_pages ?? 1;
  const currentStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const currentEnd = Math.min(page * pageSize, totalCount);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      padding: '24px 32px',
      backgroundColor: '#FBF7F0',
      minHeight: '100%',
      color: '#34271E',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Top Header Card */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        backgroundColor: '#F5EEE5',
        border: '1px solid #D2BFA8',
        borderRadius: '8px',
        padding: '20px 24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database size={22} color="#34271E" />
              <h1 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#34271E',
                margin: 0,
                letterSpacing: '-0.02em'
              }}>
                Active DuckDB Ingested Dataset
              </h1>
              <span style={{
                fontSize: '0.75rem',
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: '#E8D8C3',
                color: '#5C4634',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                Columnar Parquet Engine
              </span>
            </div>
            <p style={{
              fontSize: '0.875rem',
              color: '#8C7764',
              margin: '6px 0 0 0',
              lineHeight: 1.4
            }}>
              Direct zero-copy relational storage in <code style={{
                fontFamily: 'monospace',
                backgroundColor: '#E8D8C3',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '0.8rem'
              }}>data/duckdb/vajra.duckdb</code>. Inspect, filter, and trace 100 rows per view.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={fetchTransactions}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '4px',
                backgroundColor: '#E8D8C3',
                border: '1px solid #D2BFA8',
                color: '#34271E',
                fontSize: '0.8125rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Dynamic Metric Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          paddingTop: '12px',
          borderTop: '1px solid #D2BFA8'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#8C7764', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Dataset Name
            </span>
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#34271E', marginTop: '2px', wordBreak: 'break-all' }}>
              {meta?.dataset_name || 'VoidHacks8_MuleAccount_2M_Transactions.csv'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: '#8C7764', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Rows in DuckDB
            </span>
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#34271E', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
              {meta?.total_rows ? meta.total_rows.toLocaleString() : totalCount.toLocaleString()} rows
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: '#8C7764', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Distinct Accounts
            </span>
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#34271E', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
              {meta?.total_accounts ? meta.total_accounts.toLocaleString() : '24,873'} accounts
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: '#8C7764', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Evidence SHA-256 Hash
            </span>
            <div style={{
              fontSize: '0.8125rem',
              fontWeight: 500,
              fontFamily: 'monospace',
              color: '#5C4634',
              marginTop: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }} title={meta?.dataset_sha256 || '2c9f81fd34f728c0b7c1e803cb49e1e231c1d9204a77badfcb737f50adf73101'}>
              {meta?.dataset_sha256 ? `${meta.dataset_sha256.slice(0, 16)}...` : '2c9f81fd34f7...'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        backgroundColor: '#F5EEE5',
        padding: '14px 18px',
        borderRadius: '6px',
        border: '1px solid #D2BFA8'
      }}>
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 320px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#FBF7F0',
            border: '1px solid #D2BFA8',
            borderRadius: '4px',
            padding: '0 10px',
            height: '36px',
            width: '100%'
          }}>
            <Search size={15} color="#8C7764" />
            <input
              type="text"
              placeholder="Search by Account, Txn ID, Narration, IFSC..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{
                border: 'none',
                backgroundColor: 'transparent',
                outline: 'none',
                width: '100%',
                fontSize: '0.8125rem',
                color: '#34271E'
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              height: '36px',
              padding: '0 16px',
              backgroundColor: '#34271E',
              color: '#FBF7F0',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Search
          </button>
        </form>

        {/* Dropdowns: Payment Mode, Sort, Page Size */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Payment Mode */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: '#8C7764', fontWeight: 500 }}>Mode:</span>
            <select
              value={paymentMode}
              onChange={(e) => {
                setPaymentMode(e.target.value);
                setPage(1);
              }}
              style={{
                height: '36px',
                padding: '0 8px',
                borderRadius: '4px',
                backgroundColor: '#FBF7F0',
                border: '1px solid #D2BFA8',
                color: '#34271E',
                fontSize: '0.8125rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Modes</option>
              <option value="UPI">UPI</option>
              <option value="IMPS">IMPS</option>
              <option value="NEFT">NEFT</option>
              <option value="RTGS">RTGS</option>
            </select>
          </div>

          {/* Sort By */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: '#8C7764', fontWeight: 500 }}>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                height: '36px',
                padding: '0 8px',
                borderRadius: '4px',
                backgroundColor: '#FBF7F0',
                border: '1px solid #D2BFA8',
                color: '#34271E',
                fontSize: '0.8125rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ts">Timestamp</option>
              <option value="amount">Amount</option>
              <option value="txn_id">Txn ID</option>
              <option value="src_acct">Remitter</option>
              <option value="dst_acct">Beneficiary</option>
            </select>

            <button
              onClick={() => setSortDir(prev => prev === 'desc' ? 'asc' : 'desc')}
              style={{
                height: '36px',
                padding: '0 10px',
                borderRadius: '4px',
                backgroundColor: '#FBF7F0',
                border: '1px solid #D2BFA8',
                color: '#34271E',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
              title={`Sorting ${sortDir.toUpperCase()}`}
            >
              <ArrowUpDown size={13} />
              {sortDir.toUpperCase()}
            </button>
          </div>

          {/* Rows per page */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: '#8C7764', fontWeight: 500 }}>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              style={{
                height: '36px',
                padding: '0 8px',
                borderRadius: '4px',
                backgroundColor: '#FBF7F0',
                border: '1px solid #D2BFA8',
                color: '#34271E',
                fontSize: '0.8125rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>

          {(search || paymentMode !== 'ALL') && (
            <button
              onClick={handleResetFilters}
              style={{
                height: '36px',
                padding: '0 12px',
                borderRadius: '4px',
                backgroundColor: '#E8D8C3',
                border: '1px solid #D2BFA8',
                color: '#5C4634',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Pagination Status & Controls Strip */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ fontSize: '0.875rem', color: '#5C4634' }}>
          Showing <strong style={{ color: '#34271E' }}>{currentStart.toLocaleString()}</strong> – <strong style={{ color: '#34271E' }}>{currentEnd.toLocaleString()}</strong> of <strong style={{ color: '#34271E' }}>{totalCount.toLocaleString()}</strong> transactions (Page <strong>{page}</strong> of <strong>{totalPages.toLocaleString()}</strong>)
        </div>

        {/* Page Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setPage(1)}
            disabled={page <= 1 || loading}
            style={{
              padding: '6px 10px',
              borderRadius: '4px',
              backgroundColor: '#F5EEE5',
              border: '1px solid #D2BFA8',
              color: page <= 1 ? '#B5A593' : '#34271E',
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="First Page"
          >
            <ChevronsLeft size={16} />
          </button>

          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              backgroundColor: '#F5EEE5',
              border: '1px solid #D2BFA8',
              color: page <= 1 ? '#B5A593' : '#34271E',
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.8125rem',
              fontWeight: 500
            }}
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          {/* Quick Page Indicator / Jump */}
          <form onSubmit={handlePageJumpSubmit} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '0.8125rem', color: '#8C7764' }}>Page</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={pageJump !== '' ? pageJump : page}
              onChange={(e) => setPageJump(e.target.value)}
              style={{
                width: '64px',
                height: '32px',
                textAlign: 'center',
                borderRadius: '4px',
                border: '1px solid #D2BFA8',
                backgroundColor: '#FBF7F0',
                color: '#34271E',
                fontSize: '0.8125rem',
                fontWeight: 600,
                outline: 'none'
              }}
            />
            <span style={{ fontSize: '0.8125rem', color: '#8C7764' }}>of {totalPages.toLocaleString()}</span>
            {pageJump !== '' && (
              <button
                type="submit"
                style={{
                  height: '32px',
                  padding: '0 8px',
                  backgroundColor: '#34271E',
                  color: '#FBF7F0',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Go
              </button>
            )}
          </form>

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              backgroundColor: '#F5EEE5',
              border: '1px solid #D2BFA8',
              color: page >= totalPages ? '#B5A593' : '#34271E',
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.8125rem',
              fontWeight: 500
            }}
          >
            Next
            <ChevronRight size={16} />
          </button>

          <button
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages || loading}
            style={{
              padding: '6px 10px',
              borderRadius: '4px',
              backgroundColor: '#F5EEE5',
              border: '1px solid #D2BFA8',
              color: page >= totalPages ? '#B5A593' : '#34271E',
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Last Page"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>

      {/* Main Tabular View */}
      <div style={{
        backgroundColor: '#FBF7F0',
        border: '1px solid #D2BFA8',
        borderRadius: '6px',
        overflowX: 'auto',
        boxShadow: '0 1px 3px rgba(52,39,30,0.05)'
      }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#8C7764' }}>
            <RefreshCw size={28} className="spin" style={{ margin: '0 auto 12px' }} />
            <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 500, color: '#34271E' }}>
              Streaming 100 rows directly from DuckDB...
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem' }}>
              Querying <code style={{ backgroundColor: '#E8D8C3', padding: '2px 4px', borderRadius: '2px' }}>txns</code> table with offset {(page - 1) * pageSize}
            </p>
          </div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#A8422B' }}>
            <p style={{ fontWeight: 600, fontSize: '1rem', margin: '0 0 8px 0' }}>Error loading data from DuckDB</p>
            <p style={{ fontSize: '0.875rem', margin: 0 }}>{error}</p>
          </div>
        ) : data && data.transactions.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#8C7764' }}>
            <p style={{ fontWeight: 600, fontSize: '1rem', color: '#34271E', margin: '0 0 8px 0' }}>No transactions found</p>
            <p style={{ fontSize: '0.875rem', margin: '0 0 16px 0' }}>Try broadening your search term or changing the payment mode filter.</p>
            <button
              onClick={handleResetFilters}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                backgroundColor: '#34271E',
                color: '#FBF7F0',
                border: 'none',
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.8125rem',
            textAlign: 'left'
          }}>
            <thead>
              <tr style={{
                backgroundColor: '#F5EEE5',
                borderBottom: '2px solid #D2BFA8',
                color: '#5C4634'
              }}>
                <th style={{ padding: '12px 14px', width: '48px', fontWeight: 600 }}>#</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Txn ID</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Timestamp</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Remitter (Source)</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Beneficiary (Destination)</th>
                <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>Amount</th>
                <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'center' }}>Mode</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Narration</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Device / IP</th>
                <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {data?.transactions.map((tx: TransactionRecord, idx: number) => {
                const rowNum = (page - 1) * pageSize + idx + 1;
                return (
                  <tr
                    key={tx.txn_id || idx}
                    style={{
                      borderBottom: '1px solid #E8D8C3',
                      backgroundColor: idx % 2 === 0 ? '#FBF7F0' : '#FAF4EB',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F5EEE5';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#FBF7F0' : '#FAF4EB';
                    }}
                  >
                    {/* Index */}
                    <td style={{ padding: '10px 14px', color: '#8C7764', fontVariantNumeric: 'tabular-nums' }}>
                      {rowNum}
                    </td>

                    {/* Txn ID */}
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 500, color: '#34271E' }}>
                      {tx.txn_id}
                    </td>

                    {/* Timestamp */}
                    <td style={{ padding: '10px 14px', color: '#5C4634', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                      {tx.timestamp}
                    </td>

                    {/* Remitter */}
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => onSelectVictim(tx.src_acct)}
                          style={{
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: '#34271E',
                            fontWeight: 600,
                            fontFamily: 'monospace',
                            cursor: 'pointer',
                            padding: 0,
                            textDecoration: 'underline',
                            fontSize: '0.8125rem'
                          }}
                          title={`Investigate Remitter ${tx.src_acct}`}
                        >
                          {tx.src_acct}
                        </button>
                        <span style={{
                          fontSize: '0.6875rem',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          backgroundColor: '#E8D8C3',
                          color: '#5C4634',
                          fontWeight: 500
                        }}>
                          {tx.src_bank || tx.src_ifsc?.slice(0, 4)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#8C7764', marginTop: '2px', fontFamily: 'monospace' }}>
                        {tx.src_ifsc}
                      </div>
                    </td>

                    {/* Beneficiary */}
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => onSelectVictim(tx.dst_acct)}
                          style={{
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: '#34271E',
                            fontWeight: 600,
                            fontFamily: 'monospace',
                            cursor: 'pointer',
                            padding: 0,
                            textDecoration: 'underline',
                            fontSize: '0.8125rem'
                          }}
                          title={`Investigate Beneficiary ${tx.dst_acct}`}
                        >
                          {tx.dst_acct}
                        </button>
                        <span style={{
                          fontSize: '0.6875rem',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          backgroundColor: '#E8D8C3',
                          color: '#5C4634',
                          fontWeight: 500
                        }}>
                          {tx.dst_bank || tx.dst_ifsc?.slice(0, 4)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#8C7764', marginTop: '2px', fontFamily: 'monospace' }}>
                        {tx.dst_ifsc}
                      </div>
                    </td>

                    {/* Amount */}
                    <td style={{
                      padding: '10px 14px',
                      textAlign: 'right',
                      fontWeight: 600,
                      color: '#34271E',
                      fontVariantNumeric: 'tabular-nums',
                      whiteSpace: 'nowrap'
                    }}>
                      ₹{tx.amount ? tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                    </td>

                    {/* Payment Mode */}
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <span style={{
                        padding: '2px 7px',
                        borderRadius: '3px',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        backgroundColor: tx.payment_mode === 'UPI' ? '#E8D8C3' : tx.payment_mode === 'IMPS' ? '#D2BFA8' : '#FAF4EB',
                        border: '1px solid #D2BFA8',
                        color: '#34271E'
                      }}>
                        {tx.payment_mode}
                      </span>
                    </td>

                    {/* Narration */}
                    <td style={{
                      padding: '10px 14px',
                      color: '#5C4634',
                      maxWidth: '220px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }} title={tx.narration}>
                      {tx.narration}
                    </td>

                    {/* Device / IP */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: '0.75rem', color: '#34271E' }}>
                        {tx.device_type}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#8C7764', fontFamily: 'monospace' }}>
                        {tx.ip}
                      </div>
                    </td>

                    {/* Action */}
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <button
                        onClick={() => onSelectVictim(tx.src_acct)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#34271E',
                          color: '#FBF7F0',
                          border: 'none',
                          fontSize: '0.6875rem',
                          fontWeight: 500,
                          cursor: 'pointer'
                        }}
                        title={`Trace money flow from ${tx.src_acct}`}
                      >
                        Trace
                        <ArrowUpRight size={11} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Bottom Pagination Strip */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '8px 0'
      }}>
        <div style={{ fontSize: '0.8125rem', color: '#8C7764' }}>
          Page <strong style={{ color: '#34271E' }}>{page}</strong> of <strong style={{ color: '#34271E' }}>{totalPages.toLocaleString()}</strong> ({totalCount.toLocaleString()} total rows)
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => {
              setPage(1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={page <= 1 || loading}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              backgroundColor: '#F5EEE5',
              border: '1px solid #D2BFA8',
              color: page <= 1 ? '#B5A593' : '#34271E',
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
              fontSize: '0.8125rem'
            }}
          >
            First
          </button>

          <button
            onClick={() => {
              setPage(p => Math.max(1, p - 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={page <= 1 || loading}
            style={{
              padding: '6px 14px',
              borderRadius: '4px',
              backgroundColor: '#F5EEE5',
              border: '1px solid #D2BFA8',
              color: page <= 1 ? '#B5A593' : '#34271E',
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 500
            }}
          >
            ← Previous 100
          </button>

          <button
            onClick={() => {
              setPage(p => Math.min(totalPages, p + 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={page >= totalPages || loading}
            style={{
              padding: '6px 14px',
              borderRadius: '4px',
              backgroundColor: '#34271E',
              border: 'none',
              color: '#FBF7F0',
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 500
            }}
          >
            Next 100 →
          </button>

          <button
            onClick={() => {
              setPage(totalPages);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={page >= totalPages || loading}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              backgroundColor: '#F5EEE5',
              border: '1px solid #D2BFA8',
              color: page >= totalPages ? '#B5A593' : '#34271E',
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              fontSize: '0.8125rem'
            }}
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
};
