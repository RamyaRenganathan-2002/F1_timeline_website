import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useScrollReveal } from '../hooks/useScrollReveal'
import StatBlock from '../components/StatBlock'

const CONSTRUCTOR_COLORS = {
    ferrari: '#E8002D', mclaren: '#FF8000', mercedes: '#00D2BE',
    red_bull: '#3671C6', williams: '#005AFF', lotus_f1: '#FFD700',
    renault: '#FFD700', benetton: '#00A651', brabham: '#006B3C',
    cooper: '#006B3C', brm: '#006B3C', tyrrell: '#00008B',
    matra: '#0055A4', vanwall: '#006B3C', brawn: '#CCFF00',
    jordan: '#FFD700', alpine: '#FF87BC', lotus: '#FFD700',
    team_lotus: '#FFD700', red_bull_racing: '#3671C6',
    audi: '#BB0A21', cadillac: '#CC0000',
}

function getTeamColor(id) {
    if (!id) return '#1c1c1c'
    const key = id.toLowerCase().replace(/-/g, '_')
    for (const [k, v] of Object.entries(CONSTRUCTOR_COLORS)) {
        if (key.includes(k)) return v
    }
    return '#1c1c1c'
}

function getNationalityCode(nationality) {
    const map = {
        British: 'gb', German: 'de', Brazilian: 'br', French: 'fr',
        Italian: 'it', Austrian: 'at', Finnish: 'fi', Spanish: 'es',
        Australian: 'au', American: 'us', Dutch: 'nl', Canadian: 'ca',
        Argentine: 'ar', 'South African': 'za', Swiss: 'ch', Belgian: 'be',
        Swedish: 'se', Mexican: 'mx', 'New Zealander': 'nz', Japanese: 'jp',
        Hungarian: 'hu', Colombian: 'co', Danish: 'dk', Polish: 'pl',
        Monegasque: 'mc', Thai: 'th', Chinese: 'cn', Russian: 'ru',
        Indian: 'in', Indonesian: 'id', Venezuelan: 've', Irish: 'ie',
        Portuguese: 'pt', Czech: 'cz',
    }
    return map[nationality] || 'un'
}

const NATIONALITIES = [
    'All', 'British', 'Italian', 'German', 'French',
    'American', 'Austrian', 'Australian', 'Japanese',
]

export default function Teams() {
    const navigate = useNavigate()
    const [teams, setTeams] = useState([])
    const [championships, setChampionships] = useState({})
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [nationality, setNationality] = useState('All')
    const [sortBy, setSortBy] = useState('championships')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 24

    useEffect(() => {
        async function fetchAll() {
            const { data: teamsData } = await supabase
                .from('constructors')
                .select('*')
                .order('name', { ascending: true })

            const { data: seasons } = await supabase
                .from('seasons')
                .select('wcc_constructor_id')

            // Count championships per team
            const champMap = {}
            seasons?.forEach(s => {
                if (s.wcc_constructor_id) {
                    champMap[s.wcc_constructor_id] = (champMap[s.wcc_constructor_id] || 0) + 1
                }
            })

            setTeams(teamsData || [])
            setChampionships(champMap)
            setLoading(false)
        }
        fetchAll()
    }, [])

    const filtered = useMemo(() => {
        let result = [...teams]

        if (search) {
            result = result.filter(t =>
                t.name.toLowerCase().includes(search.toLowerCase()) ||
                t.nationality?.toLowerCase().includes(search.toLowerCase())
            )
        }

        if (nationality !== 'All') {
            result = result.filter(t => t.nationality === nationality)
        }

        if (sortBy === 'championships') {
            result.sort((a, b) => (championships[b.id] || 0) - (championships[a.id] || 0))
        } else if (sortBy === 'name') {
            result.sort((a, b) => a.name.localeCompare(b.name))
        }

        return result
    }, [teams, search, nationality, sortBy, championships])

    // Pagination
    const totalPages = Math.ceil(filtered.length / itemsPerPage)
    const paginatedTeams = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage
        return filtered.slice(start, start + itemsPerPage)
    }, [filtered, currentPage])

    useEffect(() => {
        setCurrentPage(1)
    }, [search, nationality, sortBy])

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
                    .teams-grid { grid-template-columns: 1fr !important; }
                    .page-padding { padding: 24px !important; }
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
                {/*vertical team names*/}
                <div className="hero-marquee" style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: '22%',
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
                                        TEAMS
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div className="section-label" style={{ marginBottom: '12px' }}>
                        Constructor Directory
                    </div>
                    <h1 style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: 'clamp(56px, 9vw, 112px)',
                        fontWeight: 900, textTransform: 'uppercase',
                        letterSpacing: '-2px', lineHeight: 0.95,
                        color: 'var(--text-primary)', marginBottom: '32px',
                    }}>
                        All<br />
                        <span style={{ color: '#E8002D' }}>Constructors</span>
                    </h1>

                    {/* Controls */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>

                        {/* Search */}
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
                                placeholder="Search constructors..."
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

                        {/* Nationality filter */}
                        <select
                            value={nationality}
                            onChange={e => setNationality(e.target.value)}
                            style={{
                                fontFamily: 'Barlow Condensed, sans-serif',
                                fontSize: '12px', fontWeight: 700,
                                letterSpacing: '2px', textTransform: 'uppercase',
                                padding: '10px 16px',
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border-strong)',
                                color: 'var(--text-primary)',
                                cursor: 'pointer', outline: 'none',
                            }}
                        >
                            {NATIONALITIES.map(n => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>

                        {/* Sort */}
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {[
                                { key: 'championships', label: 'By Titles' },
                                { key: 'name', label: 'A — Z' },
                            ].map(s => (
                                <button
                                    key={s.key}
                                    onClick={() => setSortBy(s.key)}
                                    style={{
                                        fontFamily: 'Barlow Condensed, sans-serif',
                                        fontSize: '11px', fontWeight: 700,
                                        letterSpacing: '2px', textTransform: 'uppercase',
                                        padding: '10px 16px',
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
            <div className="stats-bar" style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                borderBottom: '1px solid var(--border)',
            }}>
                <StatBlock label="Total Constructors" value={teams.length} color="#E8002D" borderRight />
                <StatBlock label="Showing" value={filtered.length} color="#E8002D" borderRight />
                <StatBlock label="With Titles" value={Object.keys(championships).length} color="#E8002D" />
            </div>

            {/* ── TEAMS GRID ── */}
            <div style={{ padding: '48px' }}>
                {loading ? (
                    <div style={{
                        textAlign: 'center', padding: '80px',
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '13px', letterSpacing: '3px',
                        color: 'var(--text-muted)', textTransform: 'uppercase',
                    }}>Loading constructors...</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                            gap: '1px', background: 'var(--border)',
                        }}>
                            {paginatedTeams.map(team => (
                                <TeamCard
                                    key={team.id}
                                    team={team}
                                    championships={championships[team.id] || 0}
                                    onClick={() => navigate(`/team/${team.id}`)}
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

function TeamCard({ team, championships, onClick }) {
    const ref = useScrollReveal()
    const [hovered, setHovered] = useState(false)
    const teamColor = getTeamColor(team.id)

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
                    ? 'linear-gradient(135deg, rgba(0,0,0,0.08) 0%, rgba(255,255,255,0.6) 100%)'
                    : 'linear-gradient(135deg, rgba(0,0,0,0.03) 0%, rgba(255,255,255,0.3) 100%)',
                cursor: 'pointer',
                borderTop: `3px solid ${hovered ? teamColor : 'transparent'}`,
                transition: 'all 0.2s',
                position: 'relative', overflow: 'hidden',
            }}
        >


            <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Flag + nationality */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <img
                        src={`https://flagcdn.com/w40/${getNationalityCode(team.nationality)}.png`}
                        alt={team.nationality}
                        style={{ width: '22px', height: '15px', objectFit: 'cover' }}
                        onError={e => e.target.style.display = 'none'}
                    />
                    <span className="section-label" style={{ fontSize: '9px' }}>{team.nationality}</span>
                </div>

                {/* Team name */}
                <div style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '24px', fontWeight: 900,
                    textTransform: 'uppercase', lineHeight: 1,
                    color: hovered ? teamColor : 'var(--text-primary)',
                    marginBottom: '16px', transition: 'color 0.2s',
                }}>{team.name}</div>

                <div style={{ height: '0.5px', background: 'var(--border)', marginBottom: '14px' }} />

                {/* Championships */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <div className="section-label" style={{ marginBottom: '2px' }}>WCC Titles</div>
                        <div style={{
                            fontFamily: 'Barlow Condensed, sans-serif',
                            fontSize: '36px', fontWeight: 900, lineHeight: 1,
                            color: championships > 0 ? teamColor : 'var(--text-muted)',
                        }}>{championships}</div>
                    </div>
                    {championships > 0 && (
                        <div style={{
                            fontFamily: 'Barlow Condensed, sans-serif',
                            fontSize: '10px', letterSpacing: '2px',
                            color: teamColor, textTransform: 'uppercase',
                            fontWeight: 700,
                        }}>Champion →</div>
                    )}
                </div>
            </div>
        </div>
    )
}