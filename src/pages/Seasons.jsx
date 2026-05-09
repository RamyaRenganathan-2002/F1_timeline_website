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

const ERA_RANGES = {
    'All': [1950, 2026],
    'Pre-Turbo': [1950, 1976],
    'Turbo': [1977, 1988],
    'Atmo': [1989, 2005],
    'V8': [2006, 2013],
    'Hybrid': [2014, 2026],
}

const ERA_COLORS = {
    'Pre-Turbo': '#8B4513',
    'Turbo': '#CC0000',
    'Atmo': '#FF8000',
    'V8': '#3671C6',
    'Hybrid': '#00D2BE',
}

function getEra(year) {
    if (year <= 1976) return 'Pre-Turbo'
    if (year <= 1988) return 'Turbo'
    if (year <= 2005) return 'Atmo'
    if (year <= 2013) return 'V8'
    return 'Hybrid'
}

export default function Seasons() {
    const navigate = useNavigate()
    const [seasons, setSeasons] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeEra, setActiveEra] = useState('All')
    const [search, setSearch] = useState('')
    const [sortDesc, setSortDesc] = useState(true)

    useEffect(() => {
        async function fetchSeasons() {
            const { data } = await supabase
                .from('seasons')
                .select(`
      year,
      wcc_constructor_id,
      wdc_driver_id,
      constructors:wcc_constructor_id(id, name, nationality),
      drivers:wdc_driver_id(id, name, nationality)
    `)
                .order('year', { ascending: false })

            if (data) {
                const enriched = await Promise.all(data.map(async season => {
                    if (!season.wdc_driver_id) return season
                    const { data: entry } = await supabase
                        .from('season_entries')
                        .select('constructor_id, constructors:constructor_id(name)')
                        .eq('season_year', season.year)
                        .eq('driver_id', season.wdc_driver_id)
                        .limit(1)
                        .single()
                    return {
                        ...season,
                        wdc_team: entry?.constructors?.name || null,
                        wdc_team_id: entry?.constructor_id || null,
                    }
                }))
                setSeasons(enriched)
            }
            setLoading(false)
        }
        fetchSeasons()
    }, [])


    const filtered = useMemo(() => {
        const [from, to] = ERA_RANGES[activeEra]
        let result = seasons.filter(s => {
            const inEra = s.year >= from && s.year <= to
            const inSearch = search === '' ||
                s.year.toString().includes(search) ||
                s.constructors?.name?.toLowerCase().includes(search.toLowerCase()) ||
                s.drivers?.name?.toLowerCase().includes(search.toLowerCase())
            return inEra && inSearch
        })

        return sortDesc ? result : [...result].reverse()
    }, [seasons, activeEra, search, sortDesc])

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>

            {/* ── HEADER ── */}
            <div className="page-header" style={{
                padding: '64px 48px 40px',
                borderBottom: '1px solid var(--border)',
                position: 'relative', overflow: 'hidden',
            }}>
                <style>{`
                    @media (max-width: 768px) {
                        .page-header { padding: 48px 20px 24px !important; }
                        .page-header h1 { text-align: left !important; font-size: 52px !important; }
                        .hero-marquee { right: -35% !important; width: 65% !important; }
                        .stats-bar { grid-template-columns: 1fr !important; }
                        .seasons-container { padding: 24px 20px !important; }
                        .seasons-grid { grid-template-columns: 1fr !important; }
                    }
                `}</style>
                {/* ── VERTICAL MARQUEE ── */}
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
                                        SEASONS
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div className="section-label" style={{ marginBottom: '12px' }}>
                        Championship Archive
                    </div>
                    <h1 style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: 'clamp(56px, 9vw, 112px)',
                        fontWeight: 900, textTransform: 'uppercase',
                        letterSpacing: '-2px', lineHeight: 0.95,
                        color: 'var(--text-primary)', marginBottom: '32px',
                    }}>
                        Every<br />
                        <span style={{ color: '#E8002D' }}>Season</span>
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
                                placeholder="Search by year, team or driver..."
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

                        {/* Era filters */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {Object.keys(ERA_RANGES).map(era => (
                                <button
                                    key={era}
                                    onClick={() => setActiveEra(era)}
                                    style={{
                                        fontFamily: 'Barlow Condensed, sans-serif',
                                        fontSize: '11px', fontWeight: 700,
                                        letterSpacing: '2px', textTransform: 'uppercase',
                                        padding: '8px 16px',
                                        background: activeEra === era
                                            ? (ERA_COLORS[era] || 'var(--text-primary)')
                                            : 'transparent',
                                        color: activeEra === era ? '#fff' : 'var(--text-muted)',
                                        border: '1px solid',
                                        borderColor: activeEra === era
                                            ? (ERA_COLORS[era] || 'var(--text-primary)')
                                            : 'var(--border)',
                                        cursor: 'pointer', transition: 'all 0.15s',
                                    }}
                                >{era}</button>
                            ))}
                        </div>

                        {/* Sort toggle */}
                        <button
                            onClick={() => setSortDesc(p => !p)}
                            style={{
                                fontFamily: 'Barlow Condensed, sans-serif',
                                fontSize: '11px', fontWeight: 700,
                                letterSpacing: '2px', textTransform: 'uppercase',
                                padding: '8px 16px',
                                background: 'transparent',
                                color: 'var(--text-muted)',
                                border: '1px solid var(--border)',
                                cursor: 'pointer',
                            }}
                        >{sortDesc ? '2026 → 1950' : '1950 → 2026'}</button>

                    </div>
                </div>
            </div>

            {/* ── STATS BAR ── */}
            {!loading && (
                <div className="stats-bar" style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                    borderBottom: '1px solid var(--border)',
                }}>
                    <StatBlock label="Total Seasons" value={seasons.length} color="#E8002D" borderRight />
                    <StatBlock label="Showing" value={filtered.length} color="#E8002D" borderRight />
                    <StatBlock label="Constructors Champions" value={
                        [...new Set(seasons.map(s => s.wcc_constructor_id).filter(Boolean))].length
                    } color="#E8002D" />
                </div>
            )}

            {/* ── SEASONS GRID ── */}
            <div className="seasons-container" style={{ padding: '48px' }}>
                {loading ? (
                    <div style={{
                        textAlign: 'center', padding: '80px',
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '13px', letterSpacing: '3px',
                        color: 'var(--text-muted)', textTransform: 'uppercase',
                    }}>Loading seasons...</div>
                ) : filtered.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: '80px',
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '13px', letterSpacing: '3px',
                        color: 'var(--text-muted)', textTransform: 'uppercase',
                    }}>No seasons found</div>
                ) : (
                    <div className="seasons-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: '1px', background: 'var(--border)',
                    }}>
                        {filtered.map(season => (
                            <SeasonCard
                                key={season.year}
                                season={season}
                                onClick={() => navigate(`/season/${season.year}`)}
                                onTeamClick={() => navigate(`/team/${season.wcc_constructor_id}`)}
                                onDriverClick={() => navigate(`/driver/${season.wdc_driver_id}`)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function SeasonCard({ season, onClick, onTeamClick, onDriverClick }) {
    const ref = useScrollReveal()
    const [hovered, setHovered] = useState(false)
    const teamColor = getTeamColor(season.wcc_constructor_id)
    const era = getEra(season.year)
    const eraColor = ERA_COLORS[era]

    return (
        <div
            ref={ref}
            className="timeline-entry"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={onClick}
            style={{
                padding: '24px 20px',
                background: hovered
                    ? 'linear-gradient(135deg, rgba(0,0,0,0.05) 0%, rgba(255,255,255,0.7) 100%)'
                    : 'var(--bg-surface)',
                cursor: 'pointer',
                borderTop: `3px solid ${hovered ? teamColor : eraColor}`,
                transition: 'all 0.2s',
                position: 'relative', overflow: 'hidden',
            }}
        >
            {/* Faint bg year */}
            <div style={{
                position: 'absolute', bottom: '-12px', right: '4px',
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '72px', fontWeight: 900,
                color: 'transparent',
                WebkitTextStroke: `1.5px ${teamColor}77`,
                lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
            }}>{season.year}</div>

            <div style={{ position: 'relative', zIndex: 1 }}>

                {/* Era tag */}
                <div style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    background: eraColor,
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '9px', letterSpacing: '2px',
                    fontWeight: 700, textTransform: 'uppercase',
                    color: '#fff', marginBottom: '12px',
                }}>{era} Era</div>

                {/* Year */}
                <div style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '52px', fontWeight: 900,
                    lineHeight: 1, color: teamColor,
                    marginBottom: '12px',
                }}>{season.year}</div>

                <div style={{ height: '0.5px', background: 'var(--border)', marginBottom: '12px' }} />

                {/* WCC */}
                <div className="section-label" style={{ marginBottom: '4px' }}>WCC</div>
                <button
                    onClick={e => { e.stopPropagation(); onTeamClick() }}
                    style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '15px', fontWeight: 800,
                        textTransform: 'uppercase', letterSpacing: '1px',
                        color: teamColor, background: 'none',
                        border: 'none', cursor: 'pointer',
                        padding: 0, display: 'block',
                        marginBottom: '10px', textAlign: 'left',
                    }}
                >{season.constructors?.name || '—'}</button>

                {/* WDC */}
                <div className="section-label" style={{ marginBottom: '4px' }}>WDC</div>
                <button
                    onClick={e => { e.stopPropagation(); onDriverClick() }}
                    style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '15px', fontWeight: 800,
                        textTransform: 'uppercase', letterSpacing: '1px',
                        color: 'var(--text-primary)', background: 'none',
                        border: 'none', cursor: 'pointer',
                        padding: 0, display: 'block', textAlign: 'left',
                    }}
                >{season.drivers?.name || '—'}</button>

            </div>
        </div>
    )
}