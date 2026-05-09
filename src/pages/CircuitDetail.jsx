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

function getNationalityCode(nat) {
    const map = {
        // adjective form (drivers/constructors DB)
        British: 'gb', German: 'de', Brazilian: 'br', French: 'fr',
        Italian: 'it', Austrian: 'at', Finnish: 'fi', Spanish: 'es',
        Australian: 'au', American: 'us', Dutch: 'nl', Canadian: 'ca',
        Argentine: 'ar', 'South African': 'za', Swiss: 'ch', Belgian: 'be',
        Swedish: 'se', Mexican: 'mx', 'New Zealander': 'nz', Japanese: 'jp',
        Hungarian: 'hu', Colombian: 'co', Danish: 'dk', Polish: 'pl',
        Monegasque: 'mc', Thai: 'th', Chinese: 'cn', Russian: 'ru',
        Indian: 'in', Indonesian: 'id', Venezuelan: 've', Irish: 'ie',
        Portuguese: 'pt', Czech: 'cz', American: 'us',
        // country name form (circuits DB)
        UK: 'gb', Britain: 'gb', 'United Kingdom': 'gb',
        Germany: 'de', Brazil: 'br', France: 'fr', Italy: 'it',
        Austria: 'at', Finland: 'fi', Spain: 'es', Australia: 'au',
        USA: 'us', 'United States': 'us', Netherlands: 'nl', Canada: 'ca',
        Argentina: 'ar', 'South Africa': 'za', Switzerland: 'ch',
        Belgium: 'be', Sweden: 'se', Mexico: 'mx', Japan: 'jp',
        Hungary: 'hu', Monaco: 'mc', China: 'cn', Russia: 'ru',
        Bahrain: 'bh', 'Saudi Arabia': 'sa', Qatar: 'qa', UAE: 'ae',
        'United Arab Emirates': 'ae', Singapore: 'sg', Azerbaijan: 'az',
        Korea: 'kr', Turkey: 'tr', Malaysia: 'my', Vietnam: 'vn',
        Portugal: 'pt', Morocco: 'ma', India: 'in',
    }
    return map[nat] || 'un'
}

export default function CircuitDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [circuit, setCircuit] = useState(null)
    const [winners, setWinners] = useState([])
    const [stats, setStats] = useState({ races: 0, drivers: 0, constructors: 0 })
    const [allDrivers, setAllDrivers] = useState([])
    const [allTeams, setAllTeams] = useState([])
    const [loading, setLoading] = useState(true)
    const [activePanel, setActivePanel] = useState(null) // 'drivers' | 'teams' | null

    useEffect(() => {
        async function fetchAll() {
            const { data: circuitData } = await supabase
                .from('circuits')
                .select('*')
                .eq('id', id)
                .single()

            setCircuit(circuitData)

            // Race winners at this circuit
            const { data: results } = await supabase
                .from('race_results')
                .select(`
          season_year,
          position,
          driver_id,
          constructor_id,
          fastest_lap,
          drivers:driver_id(id, name, nationality),
          constructors:constructor_id(id, name)
        `)
                .eq('circuit_id', id)
                .eq('position', 1)
                .order('season_year', { ascending: false })

            setWinners(results || [])

            // Stats — paginated fetch with driver/constructor details
            let allResults = []
            let from = 0
            const batchSize = 1000
            while (true) {
                const { data: batch } = await supabase
                    .from('race_results')
                    .select('driver_id, constructor_id, season_year, position, drivers:driver_id(id, name, nationality), constructors:constructor_id(id, name, nationality)')
                    .eq('circuit_id', id)
                    .range(from, from + batchSize - 1)
                if (!batch || batch.length === 0) break
                allResults = allResults.concat(batch)
                if (batch.length < batchSize) break
                from += batchSize
            }

            if (allResults.length > 0) {
                // Build unique drivers list with race count at this circuit
                const driverMap = {}
                allResults.forEach(r => {
                    if (!driverMap[r.driver_id]) {
                        driverMap[r.driver_id] = {
                            id: r.driver_id,
                            name: r.drivers?.name || r.driver_id,
                            nationality: r.drivers?.nationality,
                            races: 0,
                            bestFinish: Infinity,
                            lastTeamId: r.constructor_id,
                        }
                    }
                    driverMap[r.driver_id].races += 1
                    if (r.position && r.position < driverMap[r.driver_id].bestFinish) {
                        driverMap[r.driver_id].bestFinish = r.position
                    }
                })
                const driverList = Object.values(driverMap).sort((a, b) => a.races === b.races ? a.bestFinish - b.bestFinish : b.races - a.races)
                setAllDrivers(driverList)

                // Build unique constructors list with race count
                const constructorMap = {}
                allResults.forEach(r => {
                    if (!constructorMap[r.constructor_id]) {
                        constructorMap[r.constructor_id] = {
                            id: r.constructor_id,
                            name: r.constructors?.name || r.constructor_id,
                            nationality: r.constructors?.nationality,
                            entries: 0,
                            wins: 0,
                        }
                    }
                    constructorMap[r.constructor_id].entries += 1
                    if (r.position === 1) constructorMap[r.constructor_id].wins += 1
                })
                const teamList = Object.values(constructorMap).sort((a, b) => b.entries - a.entries)
                setAllTeams(teamList)

                setStats({
                    races: results?.length || 0,
                    drivers: Object.keys(driverMap).length,
                    constructors: Object.keys(constructorMap).length,
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

    if (!circuit) return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontFamily: 'Barlow Condensed, sans-serif',
            fontSize: '13px', letterSpacing: '3px', color: 'var(--text-muted)',
            textTransform: 'uppercase',
        }}>Circuit not found</div>
    )

    const googleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(
        circuit.name + ' ' + circuit.city + ' ' + circuit.country
    )}`

    // Most successful driver at this circuit
    const driverWins = {}
    winners.forEach(w => {
        driverWins[w.driver_id] = {
            name: w.drivers?.name,
            count: (driverWins[w.driver_id]?.count || 0) + 1,
            constructorId: w.constructor_id,
        }
    })
    const mostWins = Object.values(driverWins).sort((a, b) => b.count - a.count)[0]

    // Most successful constructor
    const constructorWins = {}
    winners.forEach(w => {
        constructorWins[w.constructor_id] = {
            name: w.constructors?.name,
            count: (constructorWins[w.constructor_id]?.count || 0) + 1,
        }
    })
    const mostConstructorWins = Object.values(constructorWins).sort((a, b) => b.count - a.count)[0]

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>

            {/* ── HERO ── */}
            <div className="page-header" style={{
                borderBottom: '1px solid var(--border)',
                position: 'relative', overflow: 'hidden',
                padding: '64px 48px 48px',
            }}>
                <style>{`
                    @media (max-width: 768px) {
                        .page-header { padding: 48px 20px 32px !important; }
                        .page-header h1 { text-align: left !important; font-size: 52px !important; }
                        .stats-bar { grid-template-columns: 1fr !important; }
                    }
                    @keyframes circuit-marquee {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                `}</style>

                {/* ── HORIZONTAL MARQUEE ── */}
                <div className="hero-marquee" style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    zIndex: 0,
                    lineHeight: 1,
                    maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
                }}>
                    <div style={{
                        display: 'inline-block',
                        animation: 'circuit-marquee 12s linear infinite',
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: 'clamp(80px, 12vw, 140px)',
                        fontWeight: 900, textTransform: 'uppercase',
                        color: 'transparent',
                        WebkitTextStroke: '2px #E8002D55',
                        letterSpacing: '-2px', lineHeight: 1,
                        userSelect: 'none',
                        display: 'block',
                        marginBottom: '-0.15em',
                    }}>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <span key={i} style={{ marginRight: '64px' }}>
                                {circuit.name}
                            </span>
                        ))}
                    </div>
                </div>

                <div style={{ position: 'relative', zIndex: 1 }}>
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

                    {/* Flag + location */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <img
                            src={`https://flagcdn.com/w40/${getNationalityCode(circuit.country)}.png`}
                            alt={circuit.country}
                            style={{ width: '28px', height: '19px', objectFit: 'cover' }}
                            onError={e => e.target.style.display = 'none'}
                        />
                        <span className="section-label">{circuit.city}, {circuit.country}</span>
                    </div>

                    {/* Circuit name */}
                    <h1 style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: 'clamp(40px, 6vw, 88px)',
                        fontWeight: 900, textTransform: 'uppercase',
                        letterSpacing: '-2px', lineHeight: 0.95,
                        color: '#E8002D', marginBottom: '32px',
                    }}>{circuit.name}</h1>

                    {/* Info row */}
                    <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', marginBottom: '28px' }}>
                        {mostWins && (
                            <div>
                                <div className="section-label" style={{ marginBottom: '4px' }}>Most Wins — Driver</div>
                                <div style={{
                                    fontFamily: 'Barlow Condensed, sans-serif',
                                    fontSize: '18px', fontWeight: 800,
                                    textTransform: 'uppercase',
                                    color: getTeamColor(mostWins.constructorId),
                                }}>
                                    {mostWins.name}
                                    <span style={{ color: 'var(--text-muted)', fontSize: '14px', marginLeft: '8px' }}>
                                        × {mostWins.count}
                                    </span>
                                </div>
                            </div>
                        )}

                        {mostConstructorWins && (
                            <>
                                <div style={{ width: '0.5px', background: 'var(--border)' }} />
                                <div>
                                    <div className="section-label" style={{ marginBottom: '4px' }}>Most Wins — Constructor</div>
                                    <div style={{
                                        fontFamily: 'Barlow Condensed, sans-serif',
                                        fontSize: '18px', fontWeight: 800,
                                        textTransform: 'uppercase',
                                        color: getTeamColor(
                                            Object.entries(constructorWins)
                                                .sort((a, b) => b[1].count - a[1].count)[0]?.[0]
                                        ),
                                    }}>
                                        {mostConstructorWins.name}
                                        <span style={{ color: 'var(--text-muted)', fontSize: '14px', marginLeft: '8px' }}>
                                            × {mostConstructorWins.count}
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Google Maps link */}
                    <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            fontFamily: 'Barlow Condensed, sans-serif',
                            fontSize: '11px', fontWeight: 700,
                            letterSpacing: '3px', textTransform: 'uppercase',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border)',
                            padding: '10px 20px',
                            textDecoration: 'none',
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = '#E8002D'
                            e.currentTarget.style.color = '#E8002D'
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'var(--border)'
                            e.currentTarget.style.color = 'var(--text-muted)'
                        }}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                        View on Google Maps
                    </a>
                </div>
            </div>

            {/* ── STATS BAR ── */}
            <style>{`
        @keyframes rise-up {
            from { opacity: 0; transform: translateY(28px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        .circuit-panel-card {
            animation: rise-up 0.4s ease both;
        }
        .circuit-panel-enter {
            animation: rise-up 0.35s ease both;
        }
    `}</style>
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                borderBottom: activePanel ? 'none' : '1px solid var(--border)',
            }}>
                <StatBlock label="Races Held" value={stats.races} color="#E8002D" borderRight />
                <StatBlock label="Unique Drivers" value={stats.drivers} color="#E8002D" borderRight
                    onClick={() => setActivePanel(p => p === 'drivers' ? null : 'drivers')} />
                <StatBlock label="Teams Raced" value={stats.constructors} color="#E8002D"
                    onClick={() => setActivePanel(p => p === 'teams' ? null : 'teams')} />
            </div>

            {/* ── INLINE PANEL ── */}
            {activePanel && (
                <div className="circuit-panel-enter" style={{
                    borderBottom: '1px solid var(--border)',
                    padding: '40px 48px',
                    background: 'var(--bg-surface)',
                }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
                        <h2 style={{
                            fontFamily: 'Barlow Condensed, sans-serif',
                            fontSize: '28px', fontWeight: 900, textTransform: 'uppercase', margin: 0,
                        }}>{activePanel === 'drivers' ? 'All Drivers' : 'Teams Raced'}</h2>
                        <div style={{ flex: 1, height: '0.5px', background: 'var(--border)' }} />
                        <span className="section-label">
                            {activePanel === 'drivers' ? `${allDrivers.length} drivers` : `${allTeams.length} teams`}
                        </span>
                        <button onClick={() => setActivePanel(null)} style={{
                            fontFamily: 'Barlow Condensed, sans-serif',
                            fontSize: '11px', letterSpacing: '2px', fontWeight: 700,
                            textTransform: 'uppercase', color: 'var(--text-muted)',
                            background: 'none', border: '1px solid var(--border)',
                            padding: '6px 12px', cursor: 'pointer',
                        }}>✕ Close</button>
                    </div>

                    {/* Cards grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: activePanel === 'drivers'
                            ? 'repeat(auto-fill, minmax(190px, 1fr))'
                            : 'repeat(auto-fill, minmax(210px, 1fr))',
                        gap: '12px',
                    }}>
                        {activePanel === 'drivers' && allDrivers.map((driver, i) => (
                            <div
                                key={driver.id}
                                className="circuit-panel-card"
                                onClick={() => navigate(`/driver/${driver.id}`)}
                                style={{ animationDelay: `${Math.min(i * 30, 600)}ms` }}
                            >
                                <DriverTile driver={driver} onClick={() => navigate(`/driver/${driver.id}`)} />
                            </div>
                        ))}
                        {activePanel === 'teams' && allTeams.map((team, i) => (
                            <div
                                key={team.id}
                                className="circuit-panel-card"
                                style={{ animationDelay: `${Math.min(i * 40, 700)}ms` }}
                            >
                                <TeamTile team={team} onClick={() => navigate(`/team/${team.id}`)} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── RACE WINNERS HISTORY ── */}
            <section style={{ padding: '56px 48px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '24px', marginBottom: '36px' }}>
                    <h2 style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '32px', fontWeight: 800, textTransform: 'uppercase',
                    }}>Race Winners</h2>
                    <div style={{ flex: 1, height: '0.5px', background: 'var(--border)' }} />
                    <span className="section-label">{winners.length} races</span>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 1fr 1fr 60px',
                    padding: '0 20px 12px',
                }}>
                    {['Year', 'Driver', 'Constructor', 'FL'].map((h, i) => (
                        <div key={i} className="section-label">{h}</div>
                    ))}
                </div>

                <div style={{
                    display: 'flex', flexDirection: 'column',
                    gap: '1px', background: 'var(--border)',
                }}>
                    {winners.map(winner => (
                        <WinnerRow
                            key={winner.season_year}
                            winner={winner}
                            onDriverClick={() => navigate(`/driver/${winner.driver_id}`)}
                            onTeamClick={() => navigate(`/team/${winner.constructor_id}`)}
                            onSeasonClick={() => navigate(`/season/${winner.season_year}`)}
                        />
                    ))}
                </div>
            </section>

        </div >
    )
}

function WinnerRow({ winner, onDriverClick, onTeamClick, onSeasonClick }) {
    const ref = useScrollReveal()
    const [hovered, setHovered] = useState(false)
    const teamColor = getTeamColor(winner.constructor_id)

    return (
        <div
            ref={ref}
            className="timeline-entry"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 1fr 60px',
                alignItems: 'center',
                padding: '14px 20px',
                background: hovered ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                borderLeft: `3px solid ${hovered ? teamColor : 'transparent'}`,
                transition: 'all 0.15s',
            }}
        >
            <button
                onClick={onSeasonClick}
                style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '20px', fontWeight: 900,
                    color: teamColor, background: 'none',
                    border: 'none', cursor: 'pointer',
                    padding: 0, textAlign: 'left',
                }}
            >{winner.season_year}</button>

            <button
                onClick={onDriverClick}
                style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '15px', fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '1px',
                    color: 'var(--text-primary)', background: 'none',
                    border: 'none', cursor: 'pointer',
                    padding: 0, textAlign: 'left',
                }}
            >{winner.drivers?.name || winner.driver_id}</button>

            <button
                onClick={onTeamClick}
                style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '14px', fontWeight: 700,
                    textTransform: 'uppercase',
                    color: teamColor, background: 'none',
                    border: 'none', cursor: 'pointer',
                    padding: 0, textAlign: 'left',
                }}>{winner.constructors?.name || winner.constructor_id}</button>

            <div style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '10px', letterSpacing: '2px',
                color: winner.fastest_lap ? '#9B59B6' : 'transparent',
                fontWeight: 700, textTransform: 'uppercase',
            }}>FL</div>
        </div>
    )
}

function DriverTile({ driver, onClick }) {
    const ref = useScrollReveal()
    const [hovered, setHovered] = useState(false)
    const teamColor = getTeamColor(driver.lastTeamId)

    return (
        <div
            ref={ref}
            className="timeline-entry"
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                padding: '18px 16px',
                background: hovered
                    ? 'linear-gradient(135deg, rgba(0,0,0,0.06) 0%, rgba(255,255,255,0.6) 100%)'
                    : 'var(--bg-surface)',
                cursor: 'pointer',
                borderLeft: `3px solid ${hovered ? teamColor : 'transparent'}`,
                transition: 'all 0.2s',
            }}
        >
            {/* Flag + nationality */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                {driver.nationality && (
                    <img
                        src={`https://flagcdn.com/w40/${getNationalityCode(driver.nationality)}.png`}
                        alt={driver.nationality}
                        style={{ width: '20px', height: '14px', objectFit: 'cover' }}
                        onError={e => e.target.style.display = 'none'}
                    />
                )}
                <span className="section-label" style={{ fontSize: '9px' }}>{driver.nationality || ''}</span>
            </div>

            {/* Name */}
            <div style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '16px', fontWeight: 800,
                textTransform: 'uppercase', lineHeight: 1.1,
                color: hovered ? teamColor : 'var(--text-primary)',
                marginBottom: '12px', transition: 'color 0.2s',
            }}>{driver.name}</div>

            <div style={{ height: '0.5px', background: 'var(--border)', marginBottom: '10px' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div className="section-label" style={{ marginBottom: '2px' }}>Races Here</div>
                    <div style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '24px', fontWeight: 900, lineHeight: 1,
                        color: '#E8002D',
                    }}>{driver.races}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div className="section-label" style={{ marginBottom: '2px' }}>Best</div>
                    <div style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '18px', fontWeight: 800,
                        color: driver.bestFinish === 1 ? '#FFD700' : 'var(--text-secondary)',
                    }}>P{driver.bestFinish === Infinity ? '—' : driver.bestFinish}</div>
                </div>
            </div>
        </div>
    )
}

function TeamTile({ team, onClick }) {
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
                padding: '18px 16px',
                background: hovered
                    ? 'linear-gradient(135deg, rgba(0,0,0,0.06) 0%, rgba(255,255,255,0.6) 100%)'
                    : 'var(--bg-surface)',
                cursor: 'pointer',
                borderLeft: `3px solid ${hovered ? teamColor : 'transparent'}`,
                transition: 'all 0.2s',
            }}
        >
            {/* Nationality */}
            {team.nationality && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <img
                        src={`https://flagcdn.com/w40/${getNationalityCode(team.nationality)}.png`}
                        alt={team.nationality}
                        style={{ width: '20px', height: '14px', objectFit: 'cover' }}
                        onError={e => e.target.style.display = 'none'}
                    />
                    <span className="section-label" style={{ fontSize: '9px' }}>{team.nationality}</span>
                </div>
            )}

            {/* Name */}
            <div style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '18px', fontWeight: 900,
                textTransform: 'uppercase', lineHeight: 1,
                color: hovered ? teamColor : 'var(--text-primary)',
                marginBottom: '14px', transition: 'color 0.2s',
            }}>{team.name}</div>

            <div style={{ height: '0.5px', background: 'var(--border)', marginBottom: '10px' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div className="section-label" style={{ marginBottom: '2px' }}>Entries</div>
                    <div style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '24px', fontWeight: 900, lineHeight: 1,
                        color: teamColor,
                    }}>{team.entries}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div className="section-label" style={{ marginBottom: '2px' }}>Wins</div>
                    <div style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '24px', fontWeight: 900, lineHeight: 1,
                        color: team.wins > 0 ? '#FFD700' : 'var(--text-muted)',
                    }}>{team.wins}</div>
                </div>
            </div>
        </div>
    )
}