import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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

export default function TeamDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [team, setTeam] = useState(null)
    const [seasons, setSeasons] = useState([])
    const [drivers, setDrivers] = useState([])
    const [stats, setStats] = useState({ wins: 0, podiums: 0, poles: 0, championships: 0, races: 0 })
    const [loading, setLoading] = useState(true)

    const teamColor = getTeamColor(id)

    useEffect(() => {
        async function fetchAll() {
            // Team info
            const { data: teamData } = await supabase
                .from('constructors')
                .select('*')
                .eq('id', id)
                .single()

            setTeam(teamData)

            // Championship seasons
            const { data: champSeasons } = await supabase
                .from('seasons')
                .select(`year, wdc_driver_id, drivers:wdc_driver_id(id, name, nationality)`)
                .eq('wcc_constructor_id', id)
                .order('year', { ascending: true })

            setSeasons(champSeasons || [])

            // All drivers who raced for this team
            const { data: entries } = await supabase
                .from('season_entries')
                .select(`
          season_year,
          driver_id,
          points,
          championship_position,
          drivers:driver_id(id, name, nationality)
        `)
                .eq('constructor_id', id)
                .order('season_year', { ascending: false })

            // Deduplicate drivers
            const driverMap = {}
            entries?.forEach(e => {
                if (!driverMap[e.driver_id]) {
                    driverMap[e.driver_id] = {
                        ...e.drivers,
                        seasons: [],
                        totalPoints: 0,
                    }
                }
                driverMap[e.driver_id].seasons.push(e.season_year)
                driverMap[e.driver_id].totalPoints += e.points || 0
            })
            setDrivers(Object.values(driverMap))

            // Race stats
            const { data: results } = await supabase
                .from('race_results')
                .select('position, fastest_lap, dnf')
                .eq('constructor_id', id)

            if (results) {
                const wins = results.filter(r => r.position === 1).length
                const podiums = results.filter(r => r.position <= 3).length
                const poles = results.filter(r => r.fastest_lap).length
                setStats({
                    wins,
                    podiums,
                    poles,
                    championships: champSeasons?.length || 0,
                    races: results.length,
                })
            }

            setLoading(false)
        }
        fetchAll()
    }, [id])

    if (loading) return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontFamily: 'Barlow Condensed, sans-serif',
            fontSize: '13px', letterSpacing: '3px', color: 'var(--text-muted)',
            textTransform: 'uppercase',
        }}>Loading...</div>
    )

    if (!team) return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontFamily: 'Barlow Condensed, sans-serif',
            fontSize: '13px', letterSpacing: '3px', color: 'var(--text-muted)',
            textTransform: 'uppercase',
        }}>Team not found</div>
    )

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>

            {/* ── HERO ── */}
            <div className="page-header" style={{
                borderBottom: '1px solid var(--border)',
                position: 'relative',
                overflow: 'hidden',
                padding: '64px 48px 48px',
            }}>
                <style>{`
                    @media (max-width: 768px) {
                        .page-header { padding: 48px 20px 32px !important; }
                        .page-header h1 { text-align: left !important; font-size: 52px !important; }
                        .hero-marquee { right: -15% !important; width: 65% !important; }
                        .stats-bar { grid-template-columns: 1fr !important; }
                        .content-grid { grid-template-columns: 1fr !important; }
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
                                            fontSize: '7vw',
                                            fontWeight: 900,
                                            textTransform: 'uppercase',
                                            letterSpacing: '-2px',
                                            lineHeight: 1.05,
                                            color: i % 2 === 0 ? teamColor : 'transparent',
                                            WebkitTextStroke: i % 2 !== 0 ? `1.5px ${teamColor}` : 'none',
                                            whiteSpace: 'nowrap',
                                            userSelect: 'none',
                                        }}
                                    >
                                        {team.name}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
                {/* Giant background team name */}

                {/* Back button */}
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '11px',
                        letterSpacing: '3px',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        marginBottom: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: 0,
                    }}>
                    ← Back
                </button>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    {/* Nationality flag */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <img
                            src={`https://flagcdn.com/w40/${getNationalityCode(team.nationality)}.png`}
                            alt={team.nationality}
                            style={{ width: '28px', height: '19px', objectFit: 'cover' }}
                            onError={e => e.target.style.display = 'none'}
                        />
                        <span className="section-label">{team.nationality}</span>
                    </div>

                    {/* Team name */}
                    <h1 style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: 'clamp(56px, 9vw, 120px)',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '-2px',
                        lineHeight: 0.95,
                        color: teamColor,
                        marginBottom: '32px',
                    }}>{team.name}</h1>

                    {/* Color strip */}
                    <div style={{
                        width: '80px', height: '4px',
                        background: teamColor,
                        marginBottom: '32px',
                    }} />
                </div>
            </div>

            {/* ── STATS BAR ── */}
            <div className="stats-bar" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                borderBottom: '1px solid var(--border)',
            }}>
                <StatBlock label="Championships" value={stats.championships} color={teamColor} borderRight />
                <StatBlock label="Race Wins" value={stats.wins} color={teamColor} borderRight />
                <StatBlock label="Podiums" value={stats.podiums} color={teamColor} borderRight />
                <StatBlock label="Fastest Laps" value={stats.poles} color={teamColor} borderRight />
                <StatBlock label="Race Entries" value={stats.races} color={teamColor} />
            </div>

            {/* ── CHAMPIONSHIP SEASONS ── */}
            {seasons.length > 0 && (
                <section style={{ padding: '56px 48px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '24px', marginBottom: '36px' }}>
                        <h2 style={{
                            fontFamily: 'Barlow Condensed, sans-serif',
                            fontSize: '32px', fontWeight: 800, textTransform: 'uppercase',
                        }}>Championship Seasons</h2>
                        <div style={{ flex: 1, height: '0.5px', background: 'var(--border)' }} />
                        <span className="section-label">{seasons.length} titles</span>
                    </div>

                    <div className="content-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                        gap: '1px',
                        background: 'var(--border)',
                    }}>
                        {seasons.map(s => (
                            <ChampionCard
                                key={s.year}
                                season={s}
                                teamColor={teamColor}
                                onClick={() => navigate(`/season/${s.year}`)}
                                onDriverClick={() => navigate(`/driver/${s.wdc_driver_id}`)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* ── DRIVERS ── */}
            <section style={{ padding: '56px 48px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '24px', marginBottom: '36px' }}>
                    <h2 style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '32px', fontWeight: 800, textTransform: 'uppercase',
                    }}>All Drivers</h2>
                    <div style={{ flex: 1, height: '0.5px', background: 'var(--border)' }} />
                    <span className="section-label">{drivers.length} drivers</span>
                </div>

                <div className="content-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: '1px',
                    background: 'var(--border)',
                }}>
                    {drivers.map(driver => (
                        <DriverCard
                            key={driver.id}
                            driver={driver}
                            teamColor={teamColor}
                            onClick={() => navigate(`/driver/${driver.id}`)}
                        />
                    ))}
                </div>
            </section>

        </div>
    )
}

function ChampionCard({ season, teamColor, onClick, onDriverClick }) {
    const ref = useScrollReveal()
    const [hovered, setHovered] = useState(false)

    return (
        <div
            ref={ref}
            className="timeline-entry"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                padding: '24px 20px',
                background: hovered ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                cursor: 'pointer',
                borderTop: `3px solid ${hovered ? teamColor : 'transparent'}`,
                transition: 'all 0.2s',
            }}
        >
            <div style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '48px', fontWeight: 900, lineHeight: 1,
                color: teamColor,
                marginBottom: '8px',
            }}>{season.year}</div>

            <div style={{ height: '0.5px', background: 'var(--border)', marginBottom: '10px' }} />

            <div className="section-label" style={{ marginBottom: '4px' }}>WDC</div>
            <div
                onClick={e => { e.stopPropagation(); onDriverClick() }}
                style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '14px', fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textDecorationColor: 'var(--border)',
                }}
            >{season.drivers?.name || '—'}</div>
        </div>
    )
}

function DriverCard({ driver, teamColor, onClick }) {
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
                padding: '20px',
                background: hovered ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                cursor: 'pointer',
                borderLeft: `3px solid ${hovered ? teamColor : 'transparent'}`,
                transition: 'all 0.2s',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <img
                    src={`https://flagcdn.com/w40/${getNationalityCode(driver.nationality)}.png`}
                    alt={driver.nationality}
                    style={{ width: '24px', height: '16px', objectFit: 'cover' }}
                    onError={e => e.target.style.display = 'none'}
                />
                <span className="section-label">{driver.nationality}</span>
            </div>

            <div style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '18px', fontWeight: 800,
                textTransform: 'uppercase',
                color: hovered ? teamColor : 'var(--text-primary)',
                lineHeight: 1.1,
                marginBottom: '10px',
                transition: 'color 0.2s',
            }}>{driver.name}</div>

            <div style={{ height: '0.5px', background: 'var(--border)', marginBottom: '10px' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    <div className="section-label" style={{ marginBottom: '2px' }}>Seasons</div>
                    <div style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '20px', fontWeight: 800, color: teamColor,
                    }}>{driver.seasons.length}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div className="section-label" style={{ marginBottom: '2px' }}>Points</div>
                    <div style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)',
                    }}>{Math.round(driver.totalPoints)}</div>
                </div>
            </div>
        </div>
    )
}

function BgTeamName({ name, teamColor }) {
    return (
        <div className="hero-marquee" style={{
            position: 'absolute', right: 0, top: 0, bottom: 0,
            width: '44%', overflow: 'hidden', zIndex: 0,
            display: 'flex', justifyContent: 'flex-end',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
        }}>
            <div className="vertical-marquee" style={{ display: 'flex', flexDirection: 'column', gap: '0px', height: 'fit-content', alignItems: 'flex-end' }}>
                {[...Array(2)].map((_, d) => (
                    <div key={d} style={{ display: 'flex', flexDirection: 'column', gap: '0px', alignItems: 'flex-end' }}>
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} style={{
                                fontFamily: 'Barlow Condensed, sans-serif',
                                fontSize: '8.5vw', fontWeight: 900,
                                textTransform: 'uppercase', letterSpacing: '-2px', lineHeight: 1.05,
                                color: i % 2 === 0 ? teamColor : 'transparent',
                                WebkitTextStroke: i % 2 !== 0 ? `1.5px ${teamColor}` : 'none',
                                whiteSpace: 'nowrap', userSelect: 'none',
                            }}>{name}</div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}