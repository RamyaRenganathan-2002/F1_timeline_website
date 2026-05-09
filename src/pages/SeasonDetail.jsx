import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useScrollReveal } from '../hooks/useScrollReveal'

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

const TABS = ['Driver Standings', 'Constructor Standings', 'Race Results']

export default function SeasonDetail() {
    const { year } = useParams()
    const navigate = useNavigate()
    const [season, setSeason] = useState(null)
    const [driverStandings, setDriverStandings] = useState([])
    const [constructorStandings, setConstructorStandings] = useState([])
    const [races, setRaces] = useState([])
    const [activeTab, setActiveTab] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchAll() {
            // Season info
            const { data: seasonData } = await supabase
                .from('seasons')
                .select(`
          year,
          wcc_constructor_id,
          wdc_driver_id,
          constructors:wcc_constructor_id(id, name, nationality),
          drivers:wdc_driver_id(id, name, nationality)
        `)
                .eq('year', year)
                .single()

            setSeason(seasonData)

            // Driver standings
            const { data: entries } = await supabase
                .from('season_entries')
                .select(`
          driver_id,
          constructor_id,
          points,
          championship_position,
          drivers:driver_id(id, name, nationality),
          constructors:constructor_id(id, name)
        `)
                .eq('season_year', year)
                .order('championship_position', { ascending: true, nullsFirst: false })

            setDriverStandings(entries || [])

            // Constructor standings — aggregate points per constructor
            const constructorMap = {}
            entries?.forEach(e => {
                const cid = e.constructor_id
                if (!constructorMap[cid]) {
                    constructorMap[cid] = {
                        id: cid,
                        name: e.constructors?.name || cid,
                        points: 0,
                        drivers: [],
                    }
                }
                constructorMap[cid].points += e.points || 0
                constructorMap[cid].drivers.push(e.drivers?.name || e.driver_id)
            })

            const sortedConstructors = Object.values(constructorMap)
                .sort((a, b) => b.points - a.points)
                .map((c, i) => ({ ...c, position: i + 1 }))

            setConstructorStandings(sortedConstructors)

            // Race results — unique circuits
            const { data: raceResults } = await supabase
                .from('race_results')
                .select(`
          circuit_id,
          driver_id,
          constructor_id,
          position,
          points,
          fastest_lap,
          dnf,
          circuits:circuit_id(id, name, country, city),
          drivers:driver_id(id, name),
          constructors:constructor_id(id, name)
        `)
                .eq('season_year', year)
                .order('position', { ascending: true })

            // Group by circuit
            const circuitMap = {}
            raceResults?.forEach(r => {
                const cid = r.circuit_id
                if (!circuitMap[cid]) {
                    circuitMap[cid] = {
                        circuit: r.circuits,
                        results: [],
                    }
                }
                circuitMap[cid].results.push(r)
            })

            setRaces(Object.values(circuitMap))
            setLoading(false)
        }
        fetchAll()
    }, [year])

    if (loading) return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontFamily: 'Barlow Condensed, sans-serif',
            fontSize: '13px', letterSpacing: '3px', color: 'var(--text-muted)',
            textTransform: 'uppercase',
        }}>Loading...</div>
    )

    const wccColor = getTeamColor(season?.wcc_constructor_id)

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
                                            color: i % 2 === 0 ? wccColor : 'transparent',
                                            WebkitTextStroke: i % 2 !== 0 ? `1.5px ${wccColor}` : 'none',
                                            whiteSpace: 'nowrap',
                                            userSelect: 'none',
                                        }}
                                    >
                                        {year}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

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
                    <div className="section-label" style={{ marginBottom: '12px' }}>
                        Formula 1 World Championship
                    </div>

                    <h1 style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: 'clamp(72px, 12vw, 160px)',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '-4px',
                        lineHeight: 0.9,
                        color: wccColor,
                        marginBottom: '32px',
                    }}>{year}</h1>

                    {/* Champions row */}
                    {season && (
                        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                            <div>
                                <div className="section-label" style={{ marginBottom: '6px' }}>WCC Champion</div>
                                <button
                                    onClick={() => navigate(`/team/${season.wcc_constructor_id}`)}
                                    style={{
                                        fontFamily: 'Barlow Condensed, sans-serif',
                                        fontSize: '22px', fontWeight: 800,
                                        textTransform: 'uppercase',
                                        color: wccColor,
                                        background: 'none', border: 'none',
                                        cursor: 'pointer', padding: 0,
                                        letterSpacing: '1px',
                                    }}
                                >{season.constructors?.name || '—'}</button>
                            </div>

                            <div style={{ width: '0.5px', background: 'var(--border)' }} />

                            <div>
                                <div className="section-label" style={{ marginBottom: '6px' }}>WDC Champion</div>
                                <button
                                    onClick={() => navigate(`/driver/${season.wdc_driver_id}`)}
                                    style={{
                                        fontFamily: 'Barlow Condensed, sans-serif',
                                        fontSize: '22px', fontWeight: 800,
                                        textTransform: 'uppercase',
                                        color: 'var(--text-primary)',
                                        background: 'none', border: 'none',
                                        cursor: 'pointer', padding: 0,
                                        letterSpacing: '1px',
                                    }}
                                >{season.drivers?.name || '—'}</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── TABS ── */}
            <div style={{
                display: 'flex',
                borderBottom: '1px solid var(--border)',
                padding: '0 48px',
            }}>
                {TABS.map((tab, i) => (
                    <button
                        key={i}
                        onClick={() => setActiveTab(i)}
                        style={{
                            fontFamily: 'Barlow Condensed, sans-serif',
                            fontSize: '12px', fontWeight: 700,
                            letterSpacing: '3px', textTransform: 'uppercase',
                            padding: '20px 24px',
                            background: 'none', border: 'none',
                            borderBottom: activeTab === i ? `2px solid ${wccColor}` : '2px solid transparent',
                            color: activeTab === i ? 'var(--text-primary)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            marginBottom: '-1px',
                        }}
                    >{tab}</button>
                ))}
            </div>

            {/* ── TAB CONTENT ── */}
            <div style={{ padding: '48px' }}>

                {/* Driver Standings */}
                {activeTab === 0 && (
                    <div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '60px 1fr 1fr 100px 100px',
                            gap: '0',
                            marginBottom: '1px',
                            padding: '0 20px 12px',
                        }}>
                            {['POS', 'Driver', 'Team', 'Points', ''].map((h, i) => (
                                <div key={i} className="section-label">{h}</div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)' }}>
                            {driverStandings.map(entry => (
                                <DriverStandingRow
                                    key={entry.driver_id}
                                    entry={entry}
                                    isChampion={entry.driver_id === season?.wdc_driver_id}
                                    onDriverClick={() => navigate(`/driver/${entry.driver_id}`)}
                                    onTeamClick={() => navigate(`/team/${entry.constructor_id}`)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Constructor Standings */}
                {activeTab === 1 && (
                    <div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '60px 1fr 1fr 100px',
                            gap: '0',
                            marginBottom: '1px',
                            padding: '0 20px 12px',
                        }}>
                            {['POS', 'Constructor', 'Drivers', 'Points'].map((h, i) => (
                                <div key={i} className="section-label">{h}</div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)' }}>
                            {constructorStandings.map(c => (
                                <ConstructorStandingRow
                                    key={c.id}
                                    constructor={c}
                                    isChampion={c.id === season?.wcc_constructor_id}
                                    onClick={() => navigate(`/team/${c.id}`)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Race Results */}
                {activeTab === 2 && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '1px',
                        background: 'var(--border)',
                    }}>
                        {races.map(race => (
                            <RaceCard
                                key={race.circuit?.id}
                                race={race}
                                onDriverClick={(driverId) => navigate(`/driver/${driverId}`)}
                                onTeamClick={(teamId) => navigate(`/team/${teamId}`)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function DriverStandingRow({ entry, isChampion, onDriverClick, onTeamClick }) {
    const ref = useScrollReveal()
    const [hovered, setHovered] = useState(false)
    const teamColor = getTeamColor(entry.constructor_id)
    const pos = entry.championship_position

    return (
        <div
            ref={ref}
            className="timeline-entry"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 1fr 100px 100px',
                alignItems: 'center',
                padding: '16px 20px',
                background: hovered ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                borderLeft: `3px solid ${pos === 1 ? teamColor : 'transparent'}`,
                transition: 'all 0.15s',
                cursor: 'default',
            }}
        >
            <div style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '24px', fontWeight: 900,
                color: pos === 1 ? teamColor : 'var(--text-muted)',
            }}>P{pos || '—'}</div>

            <button
                onClick={onDriverClick}
                style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '16px', fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '1px',
                    color: 'var(--text-primary)',
                    background: 'none', border: 'none',
                    cursor: 'pointer', padding: 0, textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: '8px',
                }}
            >
                <img
                    src={`https://flagcdn.com/w40/${getNationalityCode(entry.drivers?.nationality)}.png`}
                    alt=""
                    style={{ width: '20px', height: '14px', objectFit: 'cover' }}
                    onError={e => e.target.style.display = 'none'}
                />
                {entry.drivers?.name || entry.driver_id}
                {isChampion && (
                    <span style={{
                        fontSize: '9px', letterSpacing: '2px',
                        background: teamColor, color: '#fff',
                        padding: '2px 6px', fontWeight: 700,
                    }}>WDC</span>
                )}
            </button>

            <button
                onClick={onTeamClick}
                style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '14px', fontWeight: 700,
                    textTransform: 'uppercase',
                    color: teamColor,
                    background: 'none', border: 'none',
                    cursor: 'pointer', padding: 0, textAlign: 'left',
                }}
            >{entry.constructors?.name || entry.constructor_id}</button>

            <div style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '20px', fontWeight: 800,
                color: 'var(--text-primary)',
            }}>{Math.round(entry.points || 0)}</div>

            <div />
        </div>
    )
}

function ConstructorStandingRow({ constructor: c, isChampion, onClick }) {
    const ref = useScrollReveal()
    const [hovered, setHovered] = useState(false)
    const teamColor = getTeamColor(c.id)

    return (
        <div
            ref={ref}
            className="timeline-entry"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={onClick}
            style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 1fr 100px',
                alignItems: 'center',
                padding: '16px 20px',
                background: hovered ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                borderLeft: `3px solid ${c.position === 1 ? teamColor : 'transparent'}`,
                cursor: 'pointer',
                transition: 'all 0.15s',
            }}
        >
            <div style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '24px', fontWeight: 900,
                color: c.position === 1 ? teamColor : 'var(--text-muted)',
            }}>P{c.position}</div>

            <div style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '16px', fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '1px',
                color: teamColor,
                display: 'flex', alignItems: 'center', gap: '8px',
            }}>
                {c.name}
                {isChampion && (
                    <span style={{
                        fontSize: '9px', letterSpacing: '2px',
                        background: teamColor, color: '#fff',
                        padding: '2px 6px', fontWeight: 700,
                    }}>WCC</span>
                )}
            </div>

            <div style={{
                fontSize: '12px', color: 'var(--text-secondary)',
                fontFamily: 'Barlow Condensed, sans-serif',
                letterSpacing: '1px',
            }}>{c.drivers.slice(0, 2).join(' · ')}</div>

            <div style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '20px', fontWeight: 800,
                color: 'var(--text-primary)',
            }}>{Math.round(c.points)}</div>
        </div>
    )
}

function RaceCard({ race, onDriverClick, onTeamClick }) {
    const ref = useScrollReveal()
    const [hovered, setHovered] = useState(false)
    const top3 = race.results.filter(r => r.position <= 3).sort((a, b) => a.position - b.position)
    const winner = top3[0]
    const winnerColor = winner ? getTeamColor(winner.constructor_id) : '#1c1c1c'

    return (
        <div
            ref={ref}
            className="timeline-entry"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                padding: '24px 20px',
                background: hovered ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                borderTop: `3px solid ${hovered ? winnerColor : 'transparent'}`,
                transition: 'all 0.2s',
            }}
        >
            {/* Circuit */}
            <div className="section-label" style={{ marginBottom: '4px' }}>
                {race.circuit?.country}
            </div>
            <div style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '18px', fontWeight: 800,
                textTransform: 'uppercase', color: 'var(--text-primary)',
                marginBottom: '16px', lineHeight: 1.1,
            }}>{race.circuit?.name || race.circuit?.id}</div>

            <div style={{ height: '0.5px', background: 'var(--border)', marginBottom: '16px' }} />

            {/* Podium */}
            {top3.map((r, i) => (
                <div key={r.driver_id} style={{
                    display: 'flex', alignItems: 'center',
                    gap: '10px', marginBottom: '8px',
                }}>
                    <div style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '16px', fontWeight: 900, minWidth: '28px',
                        color: i === 0 ? winnerColor : 'var(--text-muted)',
                    }}>P{r.position}</div>

                    <button
                        onClick={() => onDriverClick(r.driver_id)}
                        style={{
                            fontFamily: 'Barlow Condensed, sans-serif',
                            fontSize: '14px', fontWeight: 700,
                            textTransform: 'uppercase',
                            color: i === 0 ? winnerColor : 'var(--text-primary)',
                            background: 'none', border: 'none',
                            cursor: 'pointer', padding: 0, textAlign: 'left',
                        }}
                    >{r.drivers?.name || r.driver_id}</button>

                    <button
                        onClick={() => onTeamClick(r.constructor_id)}
                        style={{
                            fontFamily: 'Barlow Condensed, sans-serif',
                            fontSize: '11px', letterSpacing: '1px',
                            textTransform: 'uppercase',
                            color: getTeamColor(r.constructor_id),
                            background: 'none', border: 'none',
                            cursor: 'pointer', padding: 0,
                            marginLeft: 'auto',
                        }}
                    >{r.constructors?.name}</button>
                </div>
            ))}
        </div>
    )
}