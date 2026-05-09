import { useNavigate } from 'react-router-dom'

export default function NotFound() {
    const navigate = useNavigate()

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-base)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            padding: '48px',
        }}>
            {/* ── VERTICAL MARQUEE BACKGROUND ── */}
            <div style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '100%',
                overflow: 'hidden',
                zIndex: 0,
                opacity: 0.1,
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
            }}>
                <div className="vertical-marquee" style={{ display: 'flex', flexDirection: 'column', gap: '0px', height: 'fit-content', alignItems: 'flex-end' }}>
                    {[...Array(2)].map((_, dupeIdx) => (
                        <div key={dupeIdx} style={{ display: 'flex', flexDirection: 'column', gap: '0px', alignItems: 'flex-end' }}>
                            {Array.from({ length: 12 }).map((_, i) => (
                                <div
                                    key={i}
                                    style={{
                                        fontFamily: 'Barlow Condensed, sans-serif',
                                        fontSize: '15vw',
                                        fontWeight: 900,
                                        textTransform: 'uppercase',
                                        letterSpacing: '-2px',
                                        lineHeight: 1,
                                        color: i % 2 === 0 ? '#E8002D' : 'transparent',
                                        WebkitTextStroke: i % 2 !== 0 ? '2px #E8002D' : 'none',
                                        whiteSpace: 'nowrap',
                                        userSelect: 'none',
                                        textAlign: 'center',
                                    }}
                                >
                                    OFF TRACK · DNF · 404
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── CONTENT ── */}
            <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <div className="section-label" style={{ marginBottom: '24px', color: '#E8002D' }}>
                    Status: Did Not Finish
                </div>
                
                <h1 style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: 'clamp(80px, 20vw, 240px)',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    lineHeight: 0.8,
                    letterSpacing: '-5px',
                    color: 'var(--text-primary)',
                    marginBottom: '32px',
                }}>
                    404
                </h1>

                <p style={{
                    fontSize: '18px',
                    color: 'var(--text-secondary)',
                    maxWidth: '480px',
                    margin: '0 auto 48px',
                    lineHeight: 1.6,
                }}>
                    You've exceeded the track limits. This section of the archive 
                    doesn't exist yet, or the route has been retired.
                </p>

                <button
                    onClick={() => navigate('/')}
                    style={{
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontSize: '13px',
                        fontWeight: 700,
                        letterSpacing: '3px',
                        textTransform: 'uppercase',
                        padding: '16px 48px',
                        background: 'var(--text-primary)',
                        color: 'var(--text-inverse)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    Return to Pit Lane →
                </button>
            </div>

            {/* ── ACCENT STRIP ── */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '8px',
                background: 'repeating-linear-gradient(45deg, #E8002D, #E8002D 20px, #1c1c1c 20px, #1c1c1c 40px)',
            }} />
        </div>
    )
}
