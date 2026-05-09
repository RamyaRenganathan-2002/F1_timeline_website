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

const DRIVER_NUMBERS = {
    norris: 4, verstappen: 33, hamilton: 44, leclerc: 16,
    russell: 63, sainz: 55, alonso: 14, perez: 11,
    stroll: 18, gasly: 10, ocon: 31, albon: 23,
    bottas: 77, zhou: 24, magnussen: 20, hulkenberg: 27,
    tsunoda: 22, ricciardo: 3, lawson: 40, bearman: 87,
    piastri: 81, antonelli: 12, hadjar: 6, doohan: 7,
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

export default function DriverDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [driver, setDriver] = useState(null)
    const [career, setCareer] = useState([])
    const [stats, setStats] = useState({ wins: 0, podiums: 0, fastestLaps: 0, championships: 0, races: 0, points: 0 })
    const [teammates, setTeammates] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchAll() {
            // Driver info
            const { data: driverData } = await supabase
                .from('drivers')
                .select('*')
                .eq('id', id)
                .single()

            setDriver(driverData)

            // Career entries — one per season
            const { data: entries } = await supabase
                .from('season_entries')
                .select(`
          season_year,
          points,
          championship_position,
          constructor_id,
          constructors:constructor_id(id, name, nationality)
        `)
                .eq('driver_id', id)
                .order('season_year', { ascending: true })

            setCareer(entries || [])

            // Race results for stats
            const { data: results } = await supabase
                .from('race_results')
                .select('position, fastest_lap, dnf, points, constructor_id')
                .eq('driver_id', id)

            if (results) {
                const wins = results.filter(r => r.position === 1).length
                const podiums = results.filter(r => r.position <= 3).length
                const fastestLaps = results.filter(r => r.fastest_lap).length
                const totalPoints = results.reduce((acc, r) => acc + (r.points || 0), 0)
                setStats({
                    wins,
                    podiums,
                    fastestLaps,
                    races: results.length,
                    points: Math.round(totalPoints),
                    championships: 0,
                })
            }

            // Championships won
            const { data: champSeasons } = await supabase
                .from('seasons')
                .select('year')
                .eq('wdc_driver_id', id)

            setStats(prev => ({ ...prev, championships: champSeasons?.length || 0 }))

            // Teammates — drivers who raced for the same team in same season
            if (entries && entries.length > 0) {
                const teamSeasonPairs = entries.map(e => ({
                    season_year: e.season_year,
                    constructor_id: e.constructor_id,
                }))

                const teammateMap = {}
                await Promise.all(teamSeasonPairs.map(async ({ season_year, constructor_id }) => {
                    const { data: sameTeam } = await supabase
                        .from('season_entries')
                        .select('driver_id, drivers:driver_id(id, name, nationality)')
                        .eq('season_year', season_year)
                        .eq('constructor_id', constructor_id)
                        .neq('driver_id', id)

                    sameTeam?.forEach(t => {
                        if (!teammateMap[t.driver_id]) {
                            teammateMap[t.driver_id] = {
                                ...t.drivers,
                                teamColor: getTeamColor(constructor_id),
                                constructorId: constructor_id,
                                seasons: [],
                            }
                        }
                        teammateMap[t.driver_id].seasons.push(season_year)
                    })
                }))

                setTeammates(Object.values(teammateMap).sort((a, b) => b.seasons.length - a.seasons.length))
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

    if (!driver) return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontFamily: 'Barlow Condensed, sans-serif',
            fontSize: '13px', letterSpacing: '3px', color: 'var(--text-muted)',
            textTransform: 'uppercase',
        }}>Driver not found</div>
    )

    // Get primary color from last team
    const lastTeamColor = career.length > 0
        ? getTeamColor(career[career.length - 1].constructor_id)
        : '#1c1c1c'

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
                        .career-grid { grid-template-columns: 1fr !important; }
                        .teammates-grid { grid-template-columns: 1fr !important; }
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
                                            color: i % 2 === 0 ? lastTeamColor : 'transparent',
                                            WebkitTextStroke: i % 2 !== 0 ? `1.5px ${lastTeamColor}` : 'none',
                                            whiteSpace: 'nowrap',
                                            userSelect: 'none',
                                        }}
                                    >
                                        {(() => {
                                            const initials = `${driver.given_name?.[0] || ''}${driver.family_name?.[0] || ''}`
                                            const number = DRIVER_NUMBERS[id]
                                            return number ? `${initials}${number}` : initials
                                        })()}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Back button */}
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '11px', letterSpacing: '3px',
                        textTransform: 'uppercase', color: 'var(--text-muted)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        marginBottom: '32px', display: 'flex',
                        alignItems: 'center', gap: '8px', padding: 0,
                    }}>← Back</button>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    {/* Flag + nationality */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <img
                            src={`https://flagcdn.com/w40/${getNationalityCode(driver.nationality)}.png`}
                            alt={driver.nationality}
                            style={{ width: '28px', height: '19px', objectFit: 'cover' }}
                            onError={e => e.target.style.display = 'none'}
                        />
                        <span className="section-label">{driver.nationality}</span>
                        {driver.dob && (
                            <>
                                <span style={{ color: 'var(--border-strong)' }}>·</span>
                                <span className="section-label">
                                    {new Date(driver.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                            </>
                        )}
                    </div>

                    {/* Driver name */}
                    <h1 style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: 'clamp(56px, 9vw, 120px)',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '-2px',
                        lineHeight: 0.95,
                        color: lastTeamColor,
                        marginBottom: '32px',
                    }}>{driver.name}</h1>

                    {/* Teams strip */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {[...new Set(career.map(e => e.constructor_id))].map(cid => {
                            const entry = career.find(e => e.constructor_id === cid)
                            return (
                                <button
                                    key={cid}
                                    onClick={() => navigate(`/team/${cid}`)}
                                    style={{
                                        fontFamily: 'Barlow Condensed, sans-serif',
                                        fontSize: '11px', fontWeight: 700,
                                        letterSpacing: '2px', textTransform: 'uppercase',
                                        padding: '5px 14px',
                                        background: 'transparent',
                                        color: getTeamColor(cid),
                                        border: `1px solid ${getTeamColor(cid)}`,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                >{entry?.constructors?.name || cid}</button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* ── STATS BAR ── */}
            {/* ── STATS BAR ── */}
            <div className="stats-bar" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                borderBottom: '1px solid var(--border)',
            }}>
                <StatBlock label="Championships" value={stats.championships} color={lastTeamColor} borderRight />
                <StatBlock label="Race Wins" value={stats.wins} color={lastTeamColor} borderRight />
                <StatBlock label="Podiums" value={stats.podiums} color={lastTeamColor} borderRight />
                <StatBlock label="Fastest Laps" value={stats.fastestLaps} color={lastTeamColor} borderRight />
                <StatBlock label="Races" value={stats.races} color={lastTeamColor} borderRight />
                <StatBlock label="Points" value={stats.points} color={lastTeamColor} />
            </div>

            {/* ── CAREER TIMELINE ── */}
            <section style={{ padding: '56px 48px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '24px', marginBottom: '36px' }}>
                    <h2 style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '32px', fontWeight: 800, textTransform: 'uppercase',
                    }}>Career History</h2>
                    <div style={{ flex: 1, height: '0.5px', background: 'var(--border)' }} />
                    <span className="section-label">{career.length} seasons</span>
                </div>

                <div className="career-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '1px',
                    background: 'var(--border)',
                }}>
                    {career.map(entry => (
                        <CareerCard
                            key={entry.season_year}
                            entry={entry}
                            onClick={() => navigate(`/season/${entry.season_year}`)}
                            onTeamClick={() => navigate(`/team/${entry.constructor_id}`)}
                        />
                    ))}
                </div>
            </section>

            {/* ── TEAMMATES ── */}
            {teammates.length > 0 && (
                <section style={{ padding: '56px 48px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '24px', marginBottom: '36px' }}>
                        <h2 style={{
                            fontFamily: 'Barlow Condensed, sans-serif',
                            fontSize: '32px', fontWeight: 800, textTransform: 'uppercase',
                        }}>Teammates</h2>
                        <div style={{ flex: 1, height: '0.5px', background: 'var(--border)' }} />
                        <span className="section-label">{teammates.length} drivers</span>
                    </div>

                    <div className="career-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '1px',
                        background: 'var(--border)',
                    }}>
                        {teammates.map(tm => (
                            <TeammateCard
                                key={tm.id}
                                teammate={tm}
                                onClick={() => navigate(`/driver/${tm.id}`)}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}

function CareerCard({ entry, onClick, onTeamClick }) {
    const ref = useScrollReveal()
    const [hovered, setHovered] = useState(false)
    const teamColor = getTeamColor(entry.constructor_id)

    return (
        <div
            ref={ref}
            className="timeline-entry"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={onClick}
            style={{
                padding: '20px',
                background: hovered ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                cursor: 'pointer',
                borderTop: `3px solid ${hovered ? teamColor : 'transparent'}`,
                transition: 'all 0.2s',
            }}
        >
            <div style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '40px', fontWeight: 900,
                color: teamColor, lineHeight: 1, marginBottom: '8px',
            }}>{entry.season_year}</div>

            <div style={{ height: '0.5px', background: 'var(--border)', marginBottom: '10px' }} />

            <button
                onClick={e => { e.stopPropagation(); onTeamClick() }}
                style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '14px', fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '1px',
                    color: teamColor, background: 'none',
                    border: 'none', cursor: 'pointer', padding: 0,
                    marginBottom: '12px', display: 'block',
                }}
            >{entry.constructors?.name || entry.constructor_id}</button>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    <div className="section-label" style={{ marginBottom: '2px' }}>Position</div>
                    <div style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '22px', fontWeight: 800,
                        color: entry.championship_position === 1 ? '#FFD700' : 'var(--text-primary)',
                    }}>
                        {entry.championship_position ? `P${entry.championship_position}` : '—'}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div className="section-label" style={{ marginBottom: '2px' }}>Points</div>
                    <div style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)',
                    }}>{Math.round(entry.points || 0)}</div>
                </div>
            </div>
        </div>
    )
}

function TeammateCard({ teammate, onClick }) {
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
                borderLeft: `3px solid ${hovered ? teammate.teamColor : 'transparent'}`,
                transition: 'all 0.2s',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <img
                    src={`https://flagcdn.com/w40/${getNationalityCode(teammate.nationality)}.png`}
                    alt={teammate.nationality}
                    style={{ width: '24px', height: '16px', objectFit: 'cover' }}
                    onError={e => e.target.style.display = 'none'}
                />
                <span className="section-label">{teammate.nationality}</span>
            </div>

            <div style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '18px', fontWeight: 800,
                textTransform: 'uppercase', lineHeight: 1.1,
                color: hovered ? teammate.teamColor : 'var(--text-primary)',
                marginBottom: '10px', transition: 'color 0.2s',
            }}>{teammate.name}</div>

            <div style={{ height: '0.5px', background: 'var(--border)', marginBottom: '10px' }} />

            <div>
                <div className="section-label" style={{ marginBottom: '2px' }}>Seasons Together</div>
                <div style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '20px', fontWeight: 800,
                    color: teammate.teamColor,
                }}>{teammate.seasons.length}</div>
            </div>
        </div>
    )
}