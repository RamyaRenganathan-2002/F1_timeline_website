import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCountUp } from '../hooks/useCountUp'

const ERA_TAGS = [
    { label: 'Pre-Turbo Era', years: '1950 — 1976', color: '#8B4513' },
    { label: 'Turbo Era', years: '1977 — 1988', color: '#CC0000' },
    { label: 'Atmo Era', years: '1989 — 2005', color: '#FF8000' },
    { label: 'V8 Era', years: '2006 — 2013', color: '#3671C6' },
    { label: 'Hybrid Era', years: '2014 — Now', color: '#00D2BE' },
]

const FEATURED_TEAMS = [
    { id: 'ferrari', name: 'Ferrari', color: '#E8002D', titles: 16 },
    { id: 'mercedes', name: 'Mercedes', color: '#00D2BE', titles: 8 },
    { id: 'red_bull', name: 'Red Bull', color: '#3671C6', titles: 6 },
    { id: 'mclaren', name: 'McLaren', color: '#FF8000', titles: 9 },
    { id: 'williams', name: 'Williams', color: '#005AFF', titles: 7 },
    { id: 'lotus_f1', name: 'Lotus', color: '#FFD700', titles: 7 },
]

export default function Home() {
    const navigate = useNavigate()
    const [stats, setStats] = useState({ seasons: 0, drivers: 0, constructors: 0, races: 0 })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            const [seasons, drivers, constructors, races] = await Promise.all([
                supabase.from('seasons').select('*', { count: 'exact', head: true }),
                supabase.from('drivers').select('*', { count: 'exact', head: true }),
                supabase.from('constructors').select('*', { count: 'exact', head: true }),
                supabase.from('race_results').select('circuit_id', { count: 'exact', head: true }),
            ])
            setStats({
                seasons: seasons.count || 0,
                drivers: drivers.count || 0,
                constructors: constructors.count || 0,
                races: races.count || 0,
            })
            setLoading(false)
        }
        fetchStats()
    }, [])

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>

            {/* ── HERO ── */}
            <section className="page-header" style={{
                padding: '72px 48px 48px',
                borderBottom: '1px solid var(--border)',
                position: 'relative',
                overflow: 'hidden',
            }}>
                <style>{`
                    @media (max-width: 768px) {
                        .page-header { padding: 48px 20px 32px !important; }
                        .page-header h1 { text-align: left !important; font-size: 56px !important; }
                        .hero-marquee { right: -25% !important; width: 60% !important; }
                        .hero-stats { grid-template-columns: repeat(2, 1fr) !important; }
                        .eras-grid { grid-template-columns: 1fr !important; }
                        .teams-grid { grid-template-columns: 1fr !important; }
                        .footer { flex-direction: column; gap: 16px; text-align: center; }
                    }
                `}</style>
                <div style={{ position: 'relative', zIndex: 1, maxWidth: '720px' }}>
                    {/* Section label */}
                    <div className="section-label" style={{ marginBottom: '20px' }}>
                        The Complete Archive · 1950 — 2026
                    </div>

                    {/* Main headline */}
                    <h1 style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: 'clamp(64px, 10vw, 128px)',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        lineHeight: 0.95,
                        letterSpacing: '-2px',
                        color: 'var(--text-primary)',
                        marginBottom: '24px',
                    }}>
                        Every<br />
                        <span style={{ color: '#E8002D' }}>Era.</span><br />
                        Every<br />
                        Team.
                    </h1>

                    <p style={{
                        fontSize: '15px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.7,
                        maxWidth: '460px',
                        marginBottom: '36px',
                    }}>
                        75 years of Formula 1. Every constructor that ever raced, every
                        driver who ever competed, every championship ever won. Explore
                        the complete visual history of the fastest sport on earth.
                    </p>

                    {/* CTA buttons */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => navigate('/timeline')}
                            style={{
                                fontFamily: 'Barlow Condensed, sans-serif',
                                fontSize: '13px',
                                fontWeight: 700,
                                letterSpacing: '3px',
                                textTransform: 'uppercase',
                                padding: '14px 32px',
                                background: 'var(--text-primary)',
                                color: 'var(--text-inverse)',
                                border: 'none',
                                cursor: 'pointer',
                            }}>
                            Explore Timeline →
                        </button>
                        <button
                            onClick={() => navigate('/season/2025')}
                            style={{
                                fontFamily: 'Barlow Condensed, sans-serif',
                                fontSize: '13px',
                                fontWeight: 700,
                                letterSpacing: '3px',
                                textTransform: 'uppercase',
                                padding: '14px 32px',
                                background: 'transparent',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-strong)',
                                cursor: 'pointer',
                            }}>
                            2025 Season
                        </button>
                    </div>
                </div>
                {/* ── VERTICAL MARQUEE ── */}
                <div className="hero-marquee" style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: '35%',
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
                                        FORMULA 1
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── TEAM COLOR STRIP ── */}
            <div style={{ display: 'flex', height: '4px' }}>
                {FEATURED_TEAMS.map(t => (
                    <div key={t.id} style={{ flex: 1, background: t.color }} />
                ))}
            </div>

            {/* ── LIVE STATS BAR ── */}
            {/* ── LIVE STATS BAR ── */}
            <section className="hero-stats" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                borderBottom: '1px solid var(--border)',
            }}>
                {[
                    { label: 'Seasons', value: stats.seasons },
                    { label: 'Drivers', value: stats.drivers },
                    { label: 'Constructors', value: stats.constructors },
                    { label: 'Race Entries', value: stats.races },
                ].map((s, i) => (
                    !loading && <StatBlock key={i} label={s.label} value={s.value} index={i} />
                ))}
            </section>

            {/* ── ERAS SECTION ── */}
            <section style={{ padding: '56px 48px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '24px', marginBottom: '36px' }}>
                    <h2 style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '36px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                    }}>The Eras</h2>
                    <div style={{ flex: 1, height: '0.5px', background: 'var(--border)' }} />
                </div>

                <div className="eras-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1px', background: 'var(--border)' }}>
                    {ERA_TAGS.map((era, i) => (
                        <div key={i} style={{
                            background: 'var(--bg-base)',
                            padding: '28px 24px',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            borderTop: `3px solid ${era.color}`,
                        }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-base)'}
                        >
                            <div style={{
                                fontFamily: 'Barlow Condensed, sans-serif',
                                fontSize: '11px',
                                letterSpacing: '3px',
                                textTransform: 'uppercase',
                                color: era.color,
                                marginBottom: '10px',
                            }}>{era.label}</div>
                            <div style={{
                                fontFamily: 'Barlow Condensed, sans-serif',
                                fontSize: '22px',
                                fontWeight: 800,
                                color: 'var(--text-primary)',
                            }}>{era.years}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FEATURED TEAMS ── */}
            <section style={{ padding: 'var(--content-padding)', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '24px', marginBottom: '36px' }}>
                    <h2 style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '36px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                    }}>Legendary Constructors</h2>
                    <div style={{ flex: 1, height: '0.5px', background: 'var(--border)' }} />
                    <button
                        onClick={() => navigate('/timeline')}
                        className="section-label"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        View All →
                    </button>
                </div>
 
                <div className="teams-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border)' }}>
                    {FEATURED_TEAMS.map(team => (
                        <div
                            key={team.id}
                            onClick={() => navigate(`/team/${team.id}`)}
                            style={{
                                background: 'var(--bg-base)',
                                padding: '36px 32px',
                                cursor: 'pointer',
                                position: 'relative',
                                overflow: 'hidden',
                                transition: 'background 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-base)'}
                        >
                            {/* Left accent bar */}
                            <div style={{
                                position: 'absolute',
                                left: 0, top: 0, bottom: 0,
                                width: '3px',
                                background: team.color,
                            }} />

                            <div style={{ paddingLeft: '16px' }}>
                                <div style={{
                                    fontFamily: 'Barlow Condensed, sans-serif',
                                    fontSize: '11px',
                                    letterSpacing: '3px',
                                    color: team.color,
                                    textTransform: 'uppercase',
                                    marginBottom: '8px',
                                }}>Constructor</div>

                                <div style={{
                                    fontFamily: 'Barlow Condensed, sans-serif',
                                    fontSize: '32px',
                                    fontWeight: 900,
                                    textTransform: 'uppercase',
                                    color: 'var(--text-primary)',
                                    lineHeight: 1,
                                    marginBottom: '20px',
                                }}>{team.name}</div>

                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                    <span style={{
                                        fontFamily: 'Barlow Condensed, sans-serif',
                                        fontSize: '52px',
                                        fontWeight: 900,
                                        color: team.color,
                                        lineHeight: 1,
                                    }}>{team.titles}</span>
                                    <span className="section-label">WCC Titles</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="footer" style={{
                padding: '32px var(--content-padding)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <div style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '11px',
                    letterSpacing: '3px',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                }}>F1 Era Timeline</div>
                <div className="section-label">Data via Jolpica · Not affiliated with FIA or Formula 1</div>
            </footer>

        </div>
    )

    function StatBlock({ label, value, index }) {
        const numeric = typeof value === 'string'
            ? parseInt(value.replace(/,/g, '')) : value
        const { count, ref } = useCountUp(numeric, 1800 + index * 200)

        return (
            <div ref={ref} style={{
                padding: '28px 32px',
                borderRight: index < 3 ? '1px solid var(--border)' : 'none',
            }}>
                <div className="section-label" style={{ marginBottom: '8px' }}>{label}</div>
                <div style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '48px', fontWeight: 800,
                    lineHeight: 1, color: 'var(--text-primary)',
                }}>{count.toLocaleString()}</div>
            </div>
        )
    }
}