import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatBlock from '../components/StatBlock'
import { useScrollReveal } from '../hooks/useScrollReveal'

const CONSTRUCTOR_COLORS = {
    ferrari: '#E8002D', mclaren: '#FF8000', mercedes: '#00D2BE',
    red_bull: '#3671C6', williams: '#005AFF',
    alpine: '#FF87BC', aston_martin: '#358C75',
    haas: '#B6BABD', sauber: '#52E252',
    racing_bulls: '#6692FF', audi: '#BB0A21', cadillac: '#CC0000',
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

const CURRENT_YEAR = 2026
const TABS = ['Driver Standings', 'Constructor Standings', 'Race Calendar']

function formatSession(session) {
    if (!session || !session.date) return null
    const date = new Date(`${session.date}T${session.time || '00:00:00'}`)
    return {
        day: date.toLocaleDateString('en-GB', { weekday: 'short' }),
        date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        time: session.time ? date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' UTC' : 'TBC'
    }
}

export default function Live() {
    const navigate = useNavigate()
    const [driverStandings, setDriverStandings] = useState([])
    const [constructorStandings, setConstructorStandings] = useState([])
    const [races, setRaces] = useState([])
    const [nextRace, setNextRace] = useState(null)
    const [countdown, setCountdown] = useState('')
    const [activeTab, setActiveTab] = useState(0)
    const [loading, setLoading] = useState(true)
    const [racesDone, setRacesDone] = useState(0)

    useEffect(() => {
        async function fetchAll() {
            const timestamp = Date.now()
            // Driver standings from Jolpica
            const [driversRes, constructorsRes, scheduleRes] = await Promise.all([
                fetch(`https://api.jolpi.ca/ergast/f1/${CURRENT_YEAR}/driverStandings.json?t=${timestamp}`),
                fetch(`https://api.jolpi.ca/ergast/f1/${CURRENT_YEAR}/constructorStandings.json?t=${timestamp}`),
                fetch(`https://api.jolpi.ca/ergast/f1/${CURRENT_YEAR}.json?limit=100&t=${timestamp}`),
            ])

            const driversData = await driversRes.json()
            const constructorsData = await constructorsRes.json()
            const scheduleData = await scheduleRes.json()

            const driverList = driversData.MRData?.StandingsTable
                ?.StandingsLists?.[0]?.DriverStandings || []
            const constructorList = constructorsData.MRData?.StandingsTable
                ?.StandingsLists?.[0]?.ConstructorStandings || []
            const raceList = scheduleData.MRData?.RaceTable?.Races || []

            setDriverStandings(driverList)
            setConstructorStandings(constructorList)
            setRaces(raceList)

            // Find next race
            const now = new Date()
            const upcoming = raceList.filter(r => {
                const raceDate = new Date(`${r.date}T${r.time || '00:00:00'}`)
                return raceDate > now
            })
            const completed = raceList.filter(r => {
                const raceDate = new Date(`${r.date}T${r.time || '00:00:00'}`)
                return raceDate <= now
            })

            setRacesDone(completed.length)
            if (upcoming.length > 0) setNextRace(upcoming[0])

            setLoading(false)
        }
        fetchAll()
    }, [])

    // Countdown timer
    useEffect(() => {
        if (!nextRace) return
        const interval = setInterval(() => {
            const now = new Date()
            const raceDate = new Date(`${nextRace.date}T${nextRace.time || '14:00:00'}`)
            const diff = raceDate - now
            if (diff <= 0) { setCountdown('Race day!'); return }
            const days = Math.floor(diff / (1000 * 60 * 60 * 24))
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            const secs = Math.floor((diff % (1000 * 60)) / 1000)
            setCountdown(`${days}d ${hours}h ${mins}m ${secs}s`)
        }, 1000)
        return () => clearInterval(interval)
    }, [nextRace])

    const totalRaces = races.length

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>

            {/* ── HERO ── */}
            <div style={{
                padding: '64px 48px 48px',
                borderBottom: '1px solid var(--border)',
                position: 'relative', overflow: 'hidden',
            }}>
                {/* Decorative Marquee */}
                <div className="hero-marquee" style={{
                    position: 'absolute', right: 0, top: 0, bottom: 0,
                    width: '40%', overflow: 'hidden', zIndex: 0,
                    display: 'flex', justifyContent: 'flex-end',
                    maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
                    opacity: 0.1
                }}>
                    <div className="vertical-marquee" style={{ display: 'flex', flexDirection: 'column', gap: '0px', height: 'fit-content', alignItems: 'flex-end' }}>
                        {[...Array(2)].map((_, d) => (
                            <div key={d} style={{ display: 'flex', flexDirection: 'column', gap: '0px', alignItems: 'flex-end' }}>
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <div key={i} style={{
                                        fontFamily: 'Barlow Condensed, sans-serif',
                                        fontSize: '8.5vw', fontWeight: 900,
                                        textTransform: 'uppercase', letterSpacing: '-2px', lineHeight: 1.05,
                                        color: i % 2 === 0 ? '#E8002D' : 'transparent',
                                        WebkitTextStroke: i % 2 !== 0 ? '1.5px #E8002D' : 'none',
                                        whiteSpace: 'nowrap', userSelect: 'none',
                                    }}>LIVE</div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="hero-content" style={{ 
                    position: 'relative', zIndex: 1, 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    gap: '48px', flexWrap: 'wrap'
                }}>
                    <div style={{ flex: '1', minWidth: '300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <div style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: '#E8002D',
                                boxShadow: '0 0 8px #E8002D',
                                animation: 'pulse 1.5s infinite',
                            }} />
                            <span className="section-label">Live Season</span>
                        </div>

                        <h1 style={{
                            fontFamily: 'Barlow Condensed, sans-serif',
                            fontSize: 'clamp(56px, 9vw, 112px)',
                            fontWeight: 900, textTransform: 'uppercase',
                            letterSpacing: '-2px', lineHeight: 0.95,
                            color: 'var(--text-primary)', marginBottom: '32px',
                        }}>
                            {CURRENT_YEAR}<br />
                            <span style={{ color: '#E8002D' }}>Season</span>
                        </h1>
                    </div>

                    {/* Next race card */}
                    {nextRace && (
                        <div className="next-race-card">
                            <div className="section-label" style={{ color: '#E8002D' }}>Next Race</div>
                            <div className="race-name">{nextRace.raceName}</div>
                            <div style={{
                                fontFamily: 'Barlow Condensed, sans-serif',
                                fontSize: '16px', letterSpacing: '2px',
                                color: 'var(--text-secondary)', textTransform: 'uppercase',
                                marginBottom: '8px'
                            }}>
                                {nextRace.Circuit?.circuitName} · {nextRace.Circuit?.Location?.country}
                            </div>
                            
                            <div style={{ height: '0.5px', background: '#E8002D33', margin: '8px 0' }} />
                            
                            <div className="sessions-container">
                                <SessionItem label="FP1" data={nextRace.FirstPractice} />
                                {nextRace.SprintQualifying && <SessionItem label="Sprint Quali" data={nextRace.SprintQualifying} />}
                                {nextRace.SecondPractice && <SessionItem label="FP2" data={nextRace.SecondPractice} />}
                                {nextRace.Sprint && <SessionItem label="Sprint" data={nextRace.Sprint} />}
                                {nextRace.ThirdPractice && <SessionItem label="FP3" data={nextRace.ThirdPractice} />}
                                <SessionItem label="Qualifying" data={nextRace.Qualifying} />
                                <SessionItem label="Grand Prix" data={{ date: nextRace.date, time: nextRace.time }} highlight />
                            </div>

                            {/* Countdown */}
                            {/* Countdown */}
                            <div className="countdown-text">{countdown}</div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .hero-content { padding: 0 48px; }
                .next-race-card { flex: 2; min-width: 400px; display: flex; flex-direction: column; gap: 12px; padding: 32px; border: 1px solid #E8002D; background: rgba(232,0,45,0.04); position: relative; }
                .race-name { font-family: 'Barlow Condensed', sans-serif; font-size: 48px; font-weight: 900; text-transform: uppercase; color: var(--text-primary); line-height: 1; }
                .sessions-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 24px; background: rgba(232,0,45,0.02); padding: 24px; border: 1px solid #E8002D11; }
                .countdown-text { position: absolute; bottom: 32px; right: 32px; font-family: 'Barlow Condensed', sans-serif; font-size: 48px; font-weight: 900; color: #E8002D; letter-spacing: 1px; text-align: right; }

                @media (max-width: 1024px) {
                    .hero-content { flex-direction: column; gap: 32px; padding: 0 32px; }
                    .next-race-card { width: 100% !important; flex: none !important; min-width: 100% !important; }
                    .countdown-text { position: static; text-align: center; margin-top: 24px; font-size: 36px; }
                }

                @media (max-width: 768px) {
                    .hero-content { padding: 0 20px !important; text-align: left !important; }
                    .hero-content h1 { text-align: left !important; font-size: 52px !important; }
                    .hero-marquee { width: 100% !important; right: -30% !important; opacity: 0.04 !important; }
                    .next-race-card { padding: 20px !important; min-width: 100% !important; border-left: 3px solid #E8002D !important; border-right: none !important; border-top: none !important; border-bottom: none !important; }
                    .race-name { font-size: 32px !important; }
                    .sessions-container { padding: 16px !important; grid-template-columns: repeat(2, 1fr) !important; gap: 16px !important; }
                    .countdown-text { position: static !important; text-align: left !important; margin-top: 16px !important; font-size: 32px !important; }
                    .stats-bar { grid-template-columns: repeat(2, 1fr) !important; }
                    .standing-row { grid-template-columns: 32px 1.5fr 1fr 40px 40px !important; padding: 10px 12px !important; gap: 6px !important; }
                    .standing-row .section-label { display: none; }
                    .standing-row button { font-size: 12px !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block !important; }
                    .calendar-grid { grid-template-columns: 1fr !important; }
                }

                .session-item { display: flex; flex-direction: column; gap: 2px; }
                .session-label-text { font-family: 'Barlow Condensed', sans-serif; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: #E8002D; font-weight: 800; }
                .session-time-text { font-family: 'Barlow Condensed', sans-serif; font-size: 15px; fontWeight: 900; color: var(--text-primary); }
                .session-date-text { font-size: 11px; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; }
            `}</style>

            {/* Pulse animation */}
            <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>

            {/* ── STATS BAR ── */}
            {!loading && (
                <div className="stats-bar" style={{
                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                    borderBottom: '1px solid var(--border)',
                }}>
                    <StatBlock label="Total Races" value={totalRaces} color="#E8002D" borderRight />
                    <StatBlock label="Races Done" value={racesDone} color="#E8002D" borderRight />
                    <StatBlock label="Remaining" value={totalRaces - racesDone} color="#E8002D" borderRight />
                    <StatBlock label="Drivers" value={driverStandings.length} color="#E8002D" />
                </div>
            )}

            {/* ── TABS ── */}
            <div style={{
                display: 'flex', borderBottom: '1px solid var(--border)',
                padding: '0 var(--content-padding)',
                overflowX: 'auto', WebkitOverflowScrolling: 'touch'
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
                            borderBottom: activeTab === i ? '2px solid #E8002D' : '2px solid transparent',
                            color: activeTab === i ? 'var(--text-primary)' : 'var(--text-muted)',
                            cursor: 'pointer', transition: 'all 0.15s',
                            marginBottom: '-1px',
                        }}
                    >{tab}</button>
                ))}
            </div>

            {/* ── TAB CONTENT ── */}
            <div style={{ padding: 'var(--content-padding)' }}>

                {loading && (
                    <div style={{
                        textAlign: 'center', padding: '80px',
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '13px', letterSpacing: '3px',
                        color: 'var(--text-muted)', textTransform: 'uppercase',
                    }}>Loading {CURRENT_YEAR} season data...</div>
                )}

                {/* Driver Standings */}
                {!loading && activeTab === 0 && (
                    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '80px 2fr 1fr 120px 120px',
                            padding: '0 32px 16px',
                        }}>
                            {['POS', 'Driver', 'Team', 'Points', 'Wins'].map((h, i) => (
                                <div key={i} className="section-label" style={{ fontSize: '11px', letterSpacing: '2px' }}>{h}</div>
                            ))}
                        </div>
                        <div style={{
                            display: 'flex', flexDirection: 'column',
                            gap: '1px', background: 'var(--border)',
                        }}>
                            {driverStandings.map((entry, i) => (
                                <LiveDriverRow
                                    key={entry.Driver.driverId}
                                    entry={entry}
                                    position={i + 1}
                                    onClick={() => navigate(`/driver/${entry.Driver.driverId}`)}
                                    onTeamClick={() => navigate(`/team/${entry.Constructors?.[0]?.constructorId}`)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Constructor Standings */}
                {!loading && activeTab === 1 && (
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '80px 2fr 120px 120px',
                            padding: '0 32px 16px',
                        }}>
                            {['POS', 'Constructor', 'Points', 'Wins'].map((h, i) => (
                                <div key={i} className="section-label" style={{ fontSize: '11px', letterSpacing: '2px' }}>{h}</div>
                            ))}
                        </div>
                        <div style={{
                            display: 'flex', flexDirection: 'column',
                            gap: '1px', background: 'var(--border)',
                        }}>
                            {constructorStandings.map((entry, i) => (
                                <LiveConstructorRow
                                    key={entry.Constructor.constructorId}
                                    entry={entry}
                                    position={i + 1}
                                    onClick={() => navigate(`/team/${entry.Constructor.constructorId}`)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Race Calendar */}
                {!loading && activeTab === 2 && (
                    <div className="calendar-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                        gap: '1px', background: 'var(--border)',
                    }}>
                        {races.map((race, i) => (
                            <RaceCalendarCard
                                key={race.round}
                                race={race}
                                isDone={new Date(`${race.date}T${race.time || '00:00:00'}`) <= new Date()}
                                isNext={nextRace?.round === race.round}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function LiveDriverRow({ entry, position, onClick, onTeamClick }) {
    const ref = useScrollReveal()
    const [hovered, setHovered] = useState(false)
    const teamColor = getTeamColor(entry.Constructors?.[0]?.constructorId)

    return (
        <div
            ref={ref}
            className="timeline-entry standing-row"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'grid',
                gridTemplateColumns: '80px 2fr 1fr 120px 120px',
                alignItems: 'center',
                padding: '24px 32px',
                background: hovered ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                borderLeft: `3px solid ${position === 1 ? teamColor : hovered ? teamColor : 'transparent'}`,
                transition: 'all 0.15s',
            }}
        >
            <div style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '28px', fontWeight: 900,
                color: position === 1 ? teamColor : 'var(--text-secondary)',
            }}>P{position}</div>

            <button
                onClick={onClick}
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
                    src={`https://flagcdn.com/w40/${getNationalityCode(entry.Driver.nationality)}.png`}
                    alt=""
                    style={{ width: '20px', height: '14px', objectFit: 'cover' }}
                    onError={e => e.target.style.display = 'none'}
                />
                {entry.Driver.givenName} {entry.Driver.familyName}
            </button>

            <button
                onClick={onTeamClick}
                style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '14px', fontWeight: 700,
                    textTransform: 'uppercase',
                    color: teamColor, background: 'none',
                    border: 'none', cursor: 'pointer',
                    padding: 0, textAlign: 'left',
                }}
            >{entry.Constructors?.[0]?.name}</button>

            <div style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '20px', fontWeight: 800,
                color: 'var(--text-primary)',
            }}>{entry.points}</div>

            <div style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '20px', fontWeight: 800,
                color: teamColor,
            }}>{entry.wins}</div>
        </div>
    )
}

function LiveConstructorRow({ entry, position, onClick }) {
    const ref = useScrollReveal()
    const [hovered, setHovered] = useState(false)
    const teamColor = getTeamColor(entry.Constructor.constructorId)

    return (
        <div
            ref={ref}
            className="timeline-entry standing-row"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={onClick}
            style={{
                display: 'grid',
                gridTemplateColumns: '80px 2fr 120px 120px',
                alignItems: 'center',
                padding: '24px 32px',
                background: hovered ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                borderLeft: `3px solid ${position === 1 ? teamColor : hovered ? teamColor : 'transparent'}`,
                cursor: 'pointer', transition: 'all 0.15s',
            }}
        >
            <div style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '28px', fontWeight: 900,
                color: position === 1 ? teamColor : 'var(--text-secondary)',
            }}>P{position}</div>

            <div style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '16px', fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '1px',
                color: teamColor,
            }}>{entry.Constructor.name}</div>

            <div style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '20px', fontWeight: 800,
                color: 'var(--text-primary)',
            }}>{entry.points}</div>

            <div style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '20px', fontWeight: 800,
                color: teamColor,
            }}>{entry.wins}</div>
        </div>
    )
}

function RaceCalendarCard({ race, isDone, isNext }) {
    const ref = useScrollReveal()
    const [hovered, setHovered] = useState(false)
    const [showSessions, setShowSessions] = useState(false)

    return (
        <div
            ref={ref}
            className="timeline-entry"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                padding: '24px 20px',
                background: isNext
                    ? 'rgba(232,0,45,0.04)'
                    : hovered
                        ? 'var(--bg-elevated)'
                        : 'var(--bg-surface)',
                borderTop: `3px solid ${isNext ? '#E8002D' : isDone ? 'var(--border)' : hovered ? '#E8002D' : 'transparent'}`,
                transition: 'all 0.2s',
                opacity: isDone ? 0.6 : 1,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {isNext && (
                <div style={{
                    position: 'absolute', top: '12px', right: '12px',
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '9px', letterSpacing: '2px',
                    background: '#E8002D', color: '#fff',
                    padding: '2px 8px', fontWeight: 700,
                    textTransform: 'uppercase',
                }}>Next</div>
            )}

            {isDone && (
                <div style={{
                    position: 'absolute', top: '12px', right: '12px',
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '9px', letterSpacing: '2px',
                    background: 'var(--text-muted)', color: '#fff',
                    padding: '2px 8px', fontWeight: 700,
                    textTransform: 'uppercase',
                }}>Done</div>
            )}

            <div style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '13px', fontWeight: 700,
                letterSpacing: '2px', textTransform: 'uppercase',
                color: '#E8002D', marginBottom: '8px',
            }}>Round {race.round}</div>

            <div style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '20px', fontWeight: 900,
                textTransform: 'uppercase', lineHeight: 1.1,
                color: 'var(--text-primary)', marginBottom: '6px',
            }}>{race.raceName}</div>

            <div style={{
                fontSize: '13px', color: 'var(--text-primary)',
                fontFamily: 'Barlow Condensed, sans-serif',
                fontWeight: 700,
                letterSpacing: '1px', textTransform: 'uppercase',
                marginBottom: '16px',
            }}>{race.Circuit?.circuitName}</div>

            <div style={{ height: '0.5px', background: 'var(--border)', marginBottom: '14px', marginTop: 'auto' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div 
                    onClick={() => setShowSessions(!showSessions)}
                    style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        cursor: 'pointer', userSelect: 'none'
                    }}
                >
                    <div className="section-label">Race Session</div>
                    <div style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '14px', fontWeight: 800,
                        color: isNext ? '#E8002D' : 'var(--text-primary)',
                    }}>
                        {new Date(race.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} @ {race.time ? race.time.slice(0, 5) : 'TBC'}
                    </div>
                </div>

                {showSessions && (
                    <div style={{
                        marginTop: '12px', padding: '12px', background: 'rgba(0,0,0,0.03)',
                        display: 'flex', flexDirection: 'column', gap: '10px',
                        borderLeft: '2px solid #E8002D'
                    }}>
                        <MiniSession label="FP1" data={race.FirstPractice} />
                        {race.SprintQualifying && <MiniSession label="Sprint Quali" data={race.SprintQualifying} />}
                        {race.SecondPractice && <MiniSession label="FP2" data={race.SecondPractice} />}
                        {race.Sprint && <MiniSession label="Sprint" data={race.Sprint} />}
                        {race.ThirdPractice && <MiniSession label="FP3" data={race.ThirdPractice} />}
                        <MiniSession label="Qualifying" data={race.Qualifying} />
                    </div>
                )}

                {!isDone && (
                    <button 
                        onClick={() => setShowSessions(!showSessions)}
                        style={{
                            background: 'none', border: 'none', padding: 0,
                            fontFamily: 'Barlow Condensed, sans-serif',
                            fontSize: '9px', fontWeight: 700, letterSpacing: '1px',
                            color: '#E8002D', textTransform: 'uppercase', cursor: 'pointer',
                            marginTop: '4px', textAlign: 'left'
                        }}
                    >
                        {showSessions ? '↑ Hide Schedule' : '↓ View Full Weekend'}
                    </button>
                )}
            </div>
        </div>
    )
}

function SessionItem({ label, data, highlight }) {
    const s = formatSession(data)
    if (!s) return null
    return (
        <div className="session-item">
            <div className="session-label-text" style={{ color: highlight ? '#E8002D' : '#333' }}>{label}</div>
            <div className="session-time-text" style={{ color: highlight ? '#E8002D' : 'inherit' }}>{s.time}</div>
            <div className="session-date-text">{s.day} {s.date}</div>
        </div>
    )
}

function MiniSession({ label, data }) {
    const s = formatSession(data)
    if (!s) return null
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div className="section-label" style={{ fontSize: '8px' }}>{label}</div>
            <div style={{ 
                fontFamily: 'Barlow Condensed, sans-serif', fontSize: '11px', fontWeight: 700,
                color: 'var(--text-primary)'
            }}>
                {s.date} · {s.time.replace(' UTC', '')}
            </div>
        </div>
    )
}
