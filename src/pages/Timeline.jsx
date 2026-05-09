import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useScrollReveal } from '../hooks/useScrollReveal'

const ERA_FILTERS = [
    { label: 'All Eras', range: [1950, 2026] },
    { label: 'Pre-Turbo', range: [1950, 1976] },
    { label: 'Turbo', range: [1977, 1988] },
    { label: 'Atmo', range: [1989, 2005] },
    { label: 'V8', range: [2006, 2013] },
    { label: 'Hybrid', range: [2014, 2026] },
]

const ERA_DIVIDERS = [
    { year: 1977, label: 'Turbo Era', color: '#CC0000' },
    { year: 1989, label: 'Atmo Era', color: '#FF8000' },
    { year: 2006, label: 'V8 Era', color: '#3671C6' },
    { year: 2014, label: 'Hybrid Era', color: '#00D2BE' },
]

const CONSTRUCTOR_COLORS = {
    ferrari: '#E8002D',
    mclaren: '#FF8000',
    mercedes: '#00D2BE',
    red_bull: '#3671C6',
    williams: '#005AFF',
    lotus_f1: '#FFD700',
    renault: '#FFD700',
    benetton: '#00A651',
    brabham: '#006B3C',
    cooper: '#006B3C',
    brm: '#006B3C',
    tyrrell: '#00008B',
    matra: '#0055A4',
    vanwall: '#006B3C',
    brawn: '#CCFF00',
    jordan: '#FFD700',
    alpine: '#FF87BC',
    lotus: '#FFD700',
    team_lotus: '#FFD700',
}

const NATIONALITY_TO_CODE = {
    British: 'gb', German: 'de', Brazilian: 'br', French: 'fr',
    Italian: 'it', Austrian: 'at', Finnish: 'fi', Spanish: 'es',
    Australian: 'au', American: 'us', Dutch: 'nl', Canadian: 'ca',
    Argentine: 'ar', South_African: 'za', 'South African': 'za',
    Swiss: 'ch', Belgian: 'be', Swedish: 'se', Mexican: 'mx',
    New_Zealander: 'nz', 'New Zealander': 'nz', Japanese: 'jp',
    Hungarian: 'hu', Colombian: 'co', Danish: 'dk', Polish: 'pl',
    Monegasque: 'mc', Thai: 'th', Chinese: 'cn', Russian: 'ru',
    Indian: 'in', Indonesian: 'id', Venezuelan: 've', Irish: 'ie',
    Portuguese: 'pt', Czech: 'cz', American_French: 'fr',
}

function getNationalityCode(nationality) {
    if (!nationality) return 'un'
    return NATIONALITY_TO_CODE[nationality] || 'un'
}

function getTeamColor(constructorId) {
    if (!constructorId) return '#1c1c1c'
    const key = constructorId.toLowerCase().replace(/-/g, '_')
    for (const [k, v] of Object.entries(CONSTRUCTOR_COLORS)) {
        if (key.includes(k)) return v
    }
    return '#1c1c1c'
}

export default function Timeline() {
    const navigate = useNavigate()
    const [seasons, setSeasons] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeEra, setActiveEra] = useState(0)
    const [search, setSearch] = useState('')

    useEffect(() => {
        async function fetchSeasons() {
            const { data, error } = await supabase
                .from('seasons')
                .select(`
      year,
      wcc_constructor_id,
      wdc_driver_id,
      constructors:wcc_constructor_id ( id, name, nationality ),
      drivers:wdc_driver_id ( id, name, nationality )
    `)
                .order('year', { ascending: true })

            if (!error) {
                // For each season fetch the WDC driver's actual team
                const enriched = await Promise.all(data.map(async season => {
                    if (!season.wdc_driver_id || !season.year) return season

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
        const [from, to] = ERA_FILTERS[activeEra].range
        return seasons.filter(s => {
            const inEra = s.year >= from && s.year <= to
            const inSearch = search === '' ||
                s.year.toString().includes(search) ||
                s.constructors?.name?.toLowerCase().includes(search.toLowerCase()) ||
                s.drivers?.name?.toLowerCase().includes(search.toLowerCase())
            return inEra && inSearch
        })
    }, [seasons, activeEra, search])

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>

            {/* ── PAGE HEADER ── */}
            <div className="page-header" style={{
                padding: '56px 48px 36px',
                borderBottom: '1px solid var(--border)',
                position: 'relative',
                overflow: 'hidden',
            }}>
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
                                            fontSize: '7vw',
                                            fontWeight: 900,
                                            textTransform: 'uppercase',
                                            letterSpacing: '-2px',
                                            lineHeight: 1.05,
                                            color: i % 2 === 0 ? '#E8002D' : 'transparent',
                                            WebkitTextStroke: i % 2 !== 0 ? `1.5px #E8002D` : 'none',
                                            whiteSpace: 'nowrap',
                                            userSelect: 'none',
                                        }}
                                    >
                                        CHAMPION
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <style>{`
                        @media (max-width: 768px) {
                            .page-header { padding: 48px 20px 24px !important; }
                            .timeline-container { padding: 40px 12px !important; }
                            .timeline-spine { left: 50% !important; transform: translateX(-50%) !important; }
                            .timeline-row { grid-template-columns: 1fr 40px 1fr !important; gap: 0 !important; }
                            .timeline-row-side { padding: 0 !important; }
                            .timeline-center { align-items: center !important; position: static !important; }
                            .era-divider-row { grid-template-columns: 1fr 100px 1fr !important; }
                            
                            /* Shrink card contents on mobile */
                            .season-card-title { font-size: 18px !important; }
                            .season-card-driver { font-size: 10px !important; }
                            .season-card-nationality { font-size: 9px !important; }
                            .season-card-flag { width: 20px !important; height: 14px !important; }
                            .season-card-container { padding: 12px 14px !important; }
                        }
                    `}</style>
                    <div className="section-label" style={{ marginBottom: '12px' }}>
                        Championship History
                    </div>
                    <h1 style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: 'clamp(48px, 7vw, 96px)',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '-2px',
                        lineHeight: 0.95,
                        color: 'var(--text-primary)',
                        marginBottom: '32px',
                    }}>
                        Constructor<br />
                        <span style={{ color: '#E8002D' }}>Timeline</span>
                    </h1>

                    {/* Search bar */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '24px',
                        maxWidth: '480px',
                    }}>
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            border: '1px solid var(--border-strong)',
                            background: 'var(--bg-surface)',
                            padding: '10px 16px',
                            gap: '10px',
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
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    fontFamily: 'Inter, sans-serif',
                                    fontSize: '13px',
                                    color: 'var(--text-primary)',
                                    width: '100%',
                                }}
                            />
                            {search && (
                                <button onClick={() => setSearch('')} style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1,
                                }}>×</button>
                            )}
                        </div>
                    </div>

                    {/* Era filter pills */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {ERA_FILTERS.map((era, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveEra(i)}
                                style={{
                                    fontFamily: 'Barlow Condensed, sans-serif',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    letterSpacing: '2px',
                                    textTransform: 'uppercase',
                                    padding: '6px 16px',
                                    background: activeEra === i ? 'var(--text-primary)' : 'transparent',
                                    color: activeEra === i ? 'var(--text-inverse)' : 'var(--text-muted)',
                                    border: '1px solid',
                                    borderColor: activeEra === i ? 'var(--text-primary)' : 'var(--border)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                }}>
                                {era.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── TIMELINE ── */}
            <div className="timeline-container" style={{ padding: '56px 48px', position: 'relative' }}>

                {loading && (
                    <div style={{
                        textAlign: 'center', padding: '80px',
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '13px', letterSpacing: '3px',
                        color: 'var(--text-muted)', textTransform: 'uppercase',
                    }}>Loading history...</div>
                )}

                {!loading && filtered.length === 0 && (
                    <div style={{
                        textAlign: 'center', padding: '80px',
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '13px', letterSpacing: '3px',
                        color: 'var(--text-muted)', textTransform: 'uppercase',
                    }}>No results found</div>
                )}

                {!loading && filtered.length > 0 && (
                    <div style={{ position: 'relative' }}>

                        {/* Center spine */}
                        <div className="timeline-spine" style={{
                            position: 'absolute',
                            left: '50%',
                            top: 0,
                            bottom: 0,
                            width: '1px',
                            background: 'var(--border)',
                            transform: 'translateX(-50%)',
                        }} />

                        {filtered.map((season, index) => {
                            const isLeft = index % 2 === 0
                            const teamColor = getTeamColor(season.wcc_constructor_id)
                            const teamName = season.constructors?.name || season.wcc_constructor_id
                            const driverName = season.drivers?.name || season.wdc_driver_id

                            // Check if we need an era divider before this year
                            const divider = ERA_DIVIDERS.find(d => d.year === season.year)

                            return (
                                <div key={season.year}>

                                    {/* Era divider */}
                                    {divider && (<EraDividerReveal divider={divider} />
                                    )}

                                    {/* Season entry */}
                                    <div className="timeline-row" style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 80px 1fr',
                                        alignItems: 'start',
                                        marginBottom: '36px',
                                        position: 'relative'
                                    }}>

                                        {/* LEFT side */}
                                        {isLeft ? (
                                            <div
                                                className="timeline-row-side"
                                                onClick={() => navigate(`/team/${season.wcc_constructor_id}`)}
                                                style={{
                                                    paddingRight: '32px',
                                                    textAlign: 'right',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <SeasonCard
                                                    season={season}
                                                    teamName={teamName}
                                                    driverName={driverName}
                                                    teamColor={teamColor}
                                                    align="right"
                                                    year={season.year}
                                                    onDriverClick={() => navigate(`/driver/${season.wdc_driver_id}`)}
                                                />
                                            </div>
                                        ) : <div className="timeline-row-side" />}

                                        {/* Center dot + year */}
                                        {/* Center dot + year */}
                                        <div className="timeline-center" style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            paddingTop: '6px',
                                            position: 'relative',
                                            zIndex: 1,
                                        }}>
                                            <DotReveal teamColor={teamColor} />
                                            <div style={{
                                                fontFamily: 'Barlow Condensed, sans-serif',
                                                fontSize: '13px',
                                                fontWeight: 800,
                                                color: 'var(--text-primary)',
                                                letterSpacing: '1px',
                                                marginTop: '6px',
                                            }}>{season.year}</div>
                                        </div>

                                        {/* RIGHT side */}
                                        {!isLeft ? (
                                            <div
                                                className="timeline-row-side"
                                                onClick={() => navigate(`/team/${season.wcc_constructor_id}`)}
                                                style={{
                                                    paddingLeft: '32px',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <SeasonCard
                                                    season={season}
                                                    teamName={teamName}
                                                    driverName={driverName}
                                                    teamColor={teamColor}
                                                    align="left"
                                                    year={season.year}
                                                    onDriverClick={() => navigate(`/driver/${season.wdc_driver_id}`)}
                                                />
                                            </div>
                                        ) : <div className="timeline-row-side" />}

                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

function SeasonCard({ season, teamName, driverName, teamColor, align, onDriverClick, year }) {
    const isOngoing = year >= 2026  // or whatever CURRENT_YEAR is
    const ref = useScrollReveal()
    const [hovered, setHovered] = useState(false)

    return (
        <div
            ref={ref}
            className={`timeline-entry season-card-container ${align === 'left' ? 'from-right' : 'from-left'}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                padding: '20px 24px',
                background: hovered
                    ? `linear-gradient(${align === 'left' ? '135deg' : '225deg'}, rgba(0,0,0,0.08) 0%, rgba(255,255,255,0.6) 100%)`
                    : `linear-gradient(${align === 'left' ? '135deg' : '225deg'}, rgba(0,0,0,0.04) 0%, rgba(255,255,255,0.4) 100%)`,
                border: '1px solid',
                boxShadow: hovered ? `0 4px 20px rgba(0,0,0,0.1)` : 'none',
                borderColor: hovered ? teamColor : 'var(--border)',
                transition: 'border-color 0.2s, background 0.2s, opacity 0.6s ease, transform 0.6s ease',
                position: 'relative',
                borderLeft: align === 'left' ? `3px solid ${teamColor}` : '1px solid var(--border)',
                borderRight: align === 'right' ? `3px solid ${teamColor}` : '1px solid var(--border)',
            }}
        >
            <div style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '10px',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: '6px',
                textAlign: align,
            }}>{isOngoing ? 'WCC Leader' : 'WCC Champion'}</div>

            <div className="season-card-title" style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '26px',
                fontWeight: 900,
                textTransform: 'uppercase',
                color: teamColor,
                lineHeight: 1,
                marginBottom: '8px',
                textAlign: align,
            }}>{teamName}</div>

            <div style={{ marginBottom: '14px', textAlign: align }}>
                <span
                    onClick={e => { e.stopPropagation(); onDriverClick() }}
                    className="season-card-driver"
                    style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        textDecorationColor: 'var(--border)',
                    }}
                >{driverName}</span>
                <span className="season-card-driver" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{isOngoing ? ' · WDC Leader' : ' · WDC'}</span>
                {season.wdc_team && (
                    <>
                        <span className="season-card-driver" style={{ fontSize: '12px', color: 'var(--text-muted)' }}> · </span>
                        <span className="season-card-driver" style={{
                            fontSize: '12px',
                            fontFamily: 'Barlow Condensed, sans-serif',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            color: getTeamColor(season.wdc_team_id),
                        }}>{season.wdc_team}</span>
                    </>
                )}
            </div>

            <div style={{ height: '0.5px', background: 'var(--border)', marginBottom: '14px' }} />

            <div style={{
                display: 'flex',
                gap: '20px',
                justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
            }}>
                <div style={{ textAlign: align === 'right' ? 'right' : 'left' }}>
                    <div style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '10px',
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        color: teamColor,
                        marginBottom: '6px',
                        fontWeight: 700,
                    }}>{isOngoing ? 'WCC Leader' : 'WCC'}</div>
                    <img
                        src={`https://flagcdn.com/w40/${getNationalityCode(season.constructors?.nationality)}.png`}
                        alt={season.constructors?.nationality}
                        className="season-card-flag"
                        style={{
                            width: '32px', height: '22px', objectFit: 'cover',
                            display: 'block', marginBottom: '5px',
                            ...(align === 'right' ? { marginLeft: 'auto' } : {})
                        }}
                        onError={e => e.target.style.display = 'none'}
                    />
                    <div className="season-card-nationality" style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '12px', fontWeight: 700,
                        color: 'var(--text-primary)',
                        textTransform: 'uppercase', letterSpacing: '1px',
                    }}>{season.constructors?.nationality || '—'}</div>
                </div>

                <div style={{ width: '0.5px', background: 'var(--border-strong)', alignSelf: 'stretch' }} />

                <div style={{ textAlign: align === 'right' ? 'right' : 'left' }}>
                    <div style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '10px',
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        color: teamColor,
                        marginBottom: '6px',
                        fontWeight: 700,
                    }}>WDC</div>
                    <img
                        src={`https://flagcdn.com/w40/${getNationalityCode(season.drivers?.nationality)}.png`}
                        alt={season.drivers?.nationality}
                        className="season-card-flag"
                        style={{
                            width: '32px', height: '22px', objectFit: 'cover',
                            display: 'block', marginBottom: '5px',
                            ...(align === 'right' ? { marginLeft: 'auto' } : {})
                        }}
                        onError={e => e.target.style.display = 'none'}
                    />
                    <div className="season-card-nationality" style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '12px', fontWeight: 700,
                        color: 'var(--text-primary)',
                        textTransform: 'uppercase', letterSpacing: '1px',
                    }}>{season.drivers?.nationality || '—'}</div>
                </div>
            </div>
        </div>
    )
}

function DotReveal({ teamColor }) {
    const ref = useScrollReveal()
    return (
        <div
            ref={ref}
            className="timeline-dot"
            style={{
                width: '12px',
                height: '12px',
                background: teamColor,
                borderRadius: '50%',
                border: '2px solid var(--bg-base)',
                outline: `1px solid ${teamColor}`,
            }}
        />
    )
}

function EraDividerReveal({ divider }) {
    const ref = useScrollReveal()
    return (
        <div
            ref={ref}
            className="era-divider era-divider-row"
            style={{
                display: 'grid',
                gridTemplateColumns: '1fr 120px 1fr',
                alignItems: 'center',
                marginBottom: '40px',
                marginTop: '8px',
            }}>
            <div style={{ height: '1px', background: 'var(--border)' }} />
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{
                    padding: '5px 14px',
                    background: divider.color,
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '9px',
                    letterSpacing: '3px',
                    color: '#fff',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                }}>{divider.label}</div>
            </div>
            <div style={{ height: '1px', background: 'var(--border)' }} />
        </div>
    )
}