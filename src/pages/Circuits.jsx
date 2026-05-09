import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useScrollReveal } from '../hooks/useScrollReveal'
import StatBlock from '../components/StatBlock'

function getNationalityCode(country) {
    const map = {
        UK: 'gb', Britain: 'gb', 'United Kingdom': 'gb',
        Germany: 'de', Brazil: 'br', France: 'fr',
        Italy: 'it', Austria: 'at', Finland: 'fi', Spain: 'es',
        Australia: 'au', USA: 'us', 'United States': 'us',
        Netherlands: 'nl', Canada: 'ca', Argentina: 'ar',
        'South Africa': 'za', Switzerland: 'ch', Belgium: 'be',
        Sweden: 'se', Mexico: 'mx', 'New Zealand': 'nz',
        Japan: 'jp', Hungary: 'hu', Colombia: 'co',
        Denmark: 'dk', Poland: 'pl', Monaco: 'mc',
        Thailand: 'th', China: 'cn', Russia: 'ru',
        India: 'in', Indonesia: 'id', Venezuela: 've',
        Ireland: 'ie', Portugal: 'pt', 'Czech Republic': 'cz',
        Bahrain: 'bh', 'Saudi Arabia': 'sa', Qatar: 'qa',
        UAE: 'ae', 'United Arab Emirates': 'ae', Singapore: 'sg',
        Azerbaijan: 'az', Vietnam: 'vn', Korea: 'kr',
        Turkey: 'tr', Malaysia: 'my', 'South Korea': 'kr',
        Morocco: 'ma', Portugal: 'pt',
    }
    return map[country] || 'un'
}

const CIRCUIT_TYPES = ['All', 'Street', 'Permanent', 'Semi-Street']

export default function Circuits() {
    const navigate = useNavigate()
    const [circuits, setCircuits] = useState([])
    const [raceCounts, setRaceCounts] = useState({})
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [sortBy, setSortBy] = useState('races')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 24

    useEffect(() => {
        async function fetchAll() {
            const { data: circuitsData } = await supabase
                .from('circuits')
                .select('*')
                .order('name', { ascending: true })

            // Count races per circuit — paginate to bypass Supabase row limit
            let allWinners = []
            let from = 0
            const batchSize = 1000
            while (true) {
                const { data: batch } = await supabase
                    .from('race_results')
                    .select('circuit_id')
                    .eq('position', 1)
                    .range(from, from + batchSize - 1)
                if (!batch || batch.length === 0) break
                allWinners = allWinners.concat(batch)
                if (batch.length < batchSize) break
                from += batchSize
            }

            const raceMap = {}
            allWinners.forEach(r => {
                if (r.circuit_id) {
                    raceMap[r.circuit_id] = (raceMap[r.circuit_id] || 0) + 1
                }
            })

            setCircuits(circuitsData || [])
            setRaceCounts(raceMap)
            setLoading(false)
        }
        fetchAll()
    }, [])

    const filtered = useMemo(() => {
        let result = [...circuits]

        if (search) {
            result = result.filter(c =>
                c.name?.toLowerCase().includes(search.toLowerCase()) ||
                c.country?.toLowerCase().includes(search.toLowerCase()) ||
                c.city?.toLowerCase().includes(search.toLowerCase())
            )
        }

        if (sortBy === 'races') {
            result.sort((a, b) => (raceCounts[b.id] || 0) - (raceCounts[a.id] || 0))
        } else if (sortBy === 'name') {
            result.sort((a, b) => a.name?.localeCompare(b.name))
        } else if (sortBy === 'country') {
            result.sort((a, b) => a.country?.localeCompare(b.country))
        }

        return result
    }, [circuits, search, sortBy, raceCounts])

    // Pagination
    const totalPages = Math.ceil(filtered.length / itemsPerPage)
    const paginatedCircuits = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage
        return filtered.slice(start, start + itemsPerPage)
    }, [filtered, currentPage])

    useEffect(() => {
        setCurrentPage(1)
    }, [search, sortBy])

    const scrollToGrid = () => {
        window.scrollTo({ top: 400, behavior: 'smooth' })
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
            <style>{`
                @media (max-width: 768px) {
                    .stats-bar { grid-template-columns: 1fr !important; }
                    .stats-bar > div { border-right: none !important; border-bottom: 1px solid var(--border); }
                    .stats-bar > div:last-child { border-bottom: none; }
                    .circuits-grid { grid-template-columns: 1fr !important; }
                    .page-header { padding: 48px 20px 24px !important; }
                    .page-header h1 { text-align: left !important; font-size: 52px !important; }
                    .hero-marquee { right: -35% !important; width: 65% !important; }
                }
            `}</style>

            {/* ── HEADER ── */}
            <div className="page-header" style={{
                padding: '64px 48px 40px',
                borderBottom: '1px solid var(--border)',
                position: 'relative', overflow: 'hidden',
            }}>
                <div className="hero-marquee" style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: '30%',
                    overflow: 'hidden',
                    zIndex: 0,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
                }}>
                    <div
                        className="vertical-marquee"
                        style={{ display: 'flex', flexDirection: 'column', gap: '0px', alignItems: 'flex-end' }}
                    >
                        {[...Array(2)].map((_, dupeIdx) => (
                            <div key={dupeIdx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            fontFamily: 'Barlow Condensed, sans-serif',
                                            fontSize: '8.5vw',
                                            fontWeight: 900,
                                            textTransform: 'uppercase',
                                            letterSpacing: '-2px',
                                            lineHeight: 1.05,
                                            color: i % 2 === 0 ? '#E8002D' : 'transparent',
                                            WebkitTextStroke: i % 2 !== 0 ? '1.5px #E8002D' : 'none',
                                            whiteSpace: 'nowrap',
                                            userSelect: 'none',
                                        }}
                                    >
                                        CIRCUITS
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div className="section-label" style={{ marginBottom: '12px' }}>
                        Circuit Directory
                    </div>
                    <h1 style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: 'clamp(56px, 9vw, 112px)',
                        fontWeight: 900, textTransform: 'uppercase',
                        letterSpacing: '-2px', lineHeight: 0.95,
                        color: 'var(--text-primary)', marginBottom: '32px',
                    }}>
                        Every<br />
                        <span style={{ color: '#E8002D' }}>Circuit</span>
                    </h1>

                    {/* Controls */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>

                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            border: '1px solid var(--border-strong)',
                            background: 'var(--bg-surface)',
                            padding: '10px 16px', minWidth: '280px',
                        }}>
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <circle cx="6.5" cy="6.5" r="5" stroke="#9a9590" strokeWidth="1.5" />
                                <path d="M10.5 10.5L14 14" stroke="#9a9590" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search circuits..."
                                style={{
                                    background: 'transparent', border: 'none', outline: 'none',
                                    fontFamily: 'Inter, sans-serif', fontSize: '13px',
                                    color: 'var(--text-primary)', width: '100%',
                                }}
                            />
                            {search && (
                                <button onClick={() => setSearch('')} style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'var(--text-muted)', fontSize: '16px',
                                }}>×</button>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '6px' }}>
                            {[
                                { key: 'races', label: 'Most Races' },
                                { key: 'name', label: 'A — Z' },
                                { key: 'country', label: 'By Country' },
                            ].map(s => (
                                <button
                                    key={s.key}
                                    onClick={() => setSortBy(s.key)}
                                    style={{
                                        fontFamily: 'Barlow Condensed, sans-serif',
                                        fontSize: '11px', fontWeight: 700,
                                        letterSpacing: '2px', textTransform: 'uppercase',
                                        padding: '8px 16px',
                                        background: sortBy === s.key ? 'var(--text-primary)' : 'transparent',
                                        color: sortBy === s.key ? 'var(--text-inverse)' : 'var(--text-muted)',
                                        border: '1px solid',
                                        borderColor: sortBy === s.key ? 'var(--text-primary)' : 'var(--border)',
                                        cursor: 'pointer', transition: 'all 0.15s',
                                    }}
                                >{s.label}</button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── STATS BAR ── */}
            {!loading && (
                <div className="stats-bar" style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                    borderBottom: '1px solid var(--border)',
                }}>
                    <StatBlock label="Total Circuits" value={circuits.length} color="#E8002D" borderRight />
                    <StatBlock label="Showing" value={filtered.length} color="#E8002D" borderRight />
                    <StatBlock label="Countries" value={
                        [...new Set(circuits.map(c => c.country).filter(Boolean))].length
                    } color="#E8002D" />
                </div>
            )}

            {/* ── CIRCUITS GRID ── */}
            <div style={{ padding: '48px' }}>
                {loading ? (
                    <div style={{
                        textAlign: 'center', padding: '80px',
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '13px', letterSpacing: '3px',
                        color: 'var(--text-muted)', textTransform: 'uppercase',
                    }}>Loading circuits...</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                        <div className="circuits-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                            gap: '1px', background: 'var(--border)',
                        }}>
                            {paginatedCircuits.map(circuit => (
                                <CircuitCard
                                    key={circuit.id}
                                    circuit={circuit}
                                    raceCount={raceCounts[circuit.id] || 0}
                                    onClick={() => navigate(`/circuit/${circuit.id}`)}
                                />
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div style={{
                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                gap: '20px', padding: '32px 0',
                                borderTop: '1px solid var(--border)',
                            }}>
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => { setCurrentPage(p => p - 1); scrollToGrid(); }}
                                    style={{
                                        fontFamily: 'Barlow Condensed, sans-serif',
                                        fontSize: '11px', fontWeight: 700, letterSpacing: '2px',
                                        padding: '12px 24px', background: 'var(--bg-ink)', color: '#fff',
                                        border: 'none', cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                        opacity: currentPage === 1 ? 0.3 : 1, textTransform: 'uppercase'
                                    }}
                                >Prev</button>

                                <div style={{
                                    fontFamily: 'Barlow Condensed, sans-serif',
                                    fontSize: '13px', fontWeight: 700, letterSpacing: '1px',
                                    color: 'var(--text-primary)', textTransform: 'uppercase'
                                }}>
                                    Page {currentPage} <span style={{ color: 'var(--text-muted)' }}>of {totalPages}</span>
                                </div>

                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => { setCurrentPage(p => p + 1); scrollToGrid(); }}
                                    style={{
                                        fontFamily: 'Barlow Condensed, sans-serif',
                                        fontSize: '11px', fontWeight: 700, letterSpacing: '2px',
                                        padding: '12px 24px', background: 'var(--bg-ink)', color: '#fff',
                                        border: 'none', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                        opacity: currentPage === totalPages ? 0.3 : 1, textTransform: 'uppercase'
                                    }}
                                >Next</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

function CircuitCard({ circuit, raceCount, onClick }) {
    const ref = useScrollReveal()
    const [hovered, setHovered] = useState(false)

    return (
        <div
            ref={ref}
            className="timeline-entry"
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                padding: '24px 20px',
                background: hovered
                    ? 'linear-gradient(135deg, rgba(0,0,0,0.06) 0%, rgba(255,255,255,0.65) 100%)'
                    : 'var(--bg-surface)',
                cursor: 'pointer',
                borderTop: `3px solid ${hovered ? '#E8002D' : 'transparent'}`,
                transition: 'all 0.2s',
                position: 'relative', overflow: 'hidden',
            }}
        >

            <div style={{ position: 'relative', zIndex: 1 }}>

                {/* Flag + country */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <img
                        src={`https://flagcdn.com/w40/${getNationalityCode(circuit.country)}.png`}
                        alt={circuit.country}
                        style={{ width: '22px', height: '15px', objectFit: 'cover' }}
                        onError={e => e.target.style.display = 'none'}
                    />
                    <span className="section-label" style={{ fontSize: '9px' }}>{circuit.country}</span>
                </div>

                {/* Circuit name */}
                <div style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '18px', fontWeight: 900,
                    textTransform: 'uppercase', lineHeight: 1.1,
                    color: hovered ? '#E8002D' : 'var(--text-primary)',
                    marginBottom: '6px', transition: 'color 0.2s',
                }}>{circuit.name}</div>

                {/* City */}
                <div style={{
                    fontSize: '12px', color: 'var(--text-secondary)',
                    marginBottom: '16px',
                    fontFamily: 'Barlow Condensed, sans-serif',
                    letterSpacing: '1px', textTransform: 'uppercase',
                }}>{circuit.city}</div>

                <div style={{ height: '0.5px', background: 'var(--border)', marginBottom: '14px' }} />

                {/* Race count */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <div className="section-label" style={{ marginBottom: '2px' }}>Races Held</div>
                        <div style={{
                            fontFamily: 'Barlow Condensed, sans-serif',
                            fontSize: '36px', fontWeight: 900, lineHeight: 1,
                            color: raceCount > 0 ? '#E8002D' : 'var(--text-muted)',
                        }}>{raceCount}</div>
                    </div>
                    <div style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '10px', letterSpacing: '2px',
                        color: '#E8002D', textTransform: 'uppercase',
                        fontWeight: 700,
                    }}>View →</div>
                </div>
            </div>
        </div>
    )
}