import { Link, useLocation } from 'react-router-dom'

const links = [
    { to: '/', label: 'Home' },
    { to: '/timeline', label: 'Timeline' },
    { to: '/seasons', label: 'Seasons' },
    { to: '/teams', label: 'Teams' },
    { to: '/drivers', label: 'Drivers' },
    { to: '/circuits', label: 'Circuits' },
    { to: '/live', label: 'Live' },
]

export default function Navbar() {
    const { pathname } = useLocation()

    return (
        <nav 
            className="nav-container"
            style={{
                position: 'fixed',
                left: 0,
                background: '#1c1c1c',
                zIndex: 100,
                display: 'flex',
                transition: 'all 0.3s ease',
            }}
        >
            <style>{`
                .nav-container {
                    top: 0; bottom: 0;
                    width: 64px;
                    flex-direction: column;
                    align-items: center;
                    padding: 28px 0;
                    border-right: 1px solid #2a2a2a;
                }

                @media (max-width: 768px) {
                    .nav-container {
                        top: auto !important;
                        bottom: 0 !important;
                        left: 0 !important;
                        right: 0 !important;
                        width: 100% !important;
                        height: 56px !important;
                        flex-direction: row !important;
                        padding: 0 16px !important;
                        border-right: none !important;
                        border-top: 1px solid #2a2a2a !important;
                        justify-content: space-around !important;
                        overflow-x: auto !important;
                        -webkit-overflow-scrolling: touch !important;
                        z-index: 9999 !important;
                    }
                    .nav-logo, .nav-stamp { display: none; }
                    .nav-links { 
                        flex-direction: row !important; 
                        gap: 24px !important; 
                        padding: 0 12px;
                    }
                    .nav-link {
                        writing-mode: horizontal-tb !important;
                        transform: rotate(0deg) !important;
                        border-left: none !important;
                        border-bottom: 2px solid transparent;
                        padding: 16px 0 !important;
                    }
                    .nav-link.active {
                        border-bottom: 2px solid #E8002D !important;
                    }
                }
            `}</style>

            {/* Logo mark */}
            <Link to="/" className="nav-logo" style={{ marginBottom: '40px' }}>
                <div style={{
                    width: '36px',
                    height: '36px',
                    background: '#E8002D',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontWeight: 900,
                    fontSize: '11px',
                    color: '#fff',
                    letterSpacing: '-0.5px',
                }}>F1</div>
            </Link>

            {/* Vertical nav links */}
            <div className="nav-links" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '36px',
                flex: 1,
            }}>
                {links.map(link => {
                    const active = pathname === link.to
                    return (
                        <Link 
                            key={link.to} 
                            to={link.to} 
                            className={`nav-link ${active ? 'active' : ''}`}
                            style={{
                                writingMode: 'vertical-lr',
                                transform: 'rotate(180deg)',
                                fontFamily: 'Barlow Condensed, sans-serif',
                                fontSize: '11px',
                                fontWeight: 600,
                                letterSpacing: '3px',
                                textTransform: 'uppercase',
                                color: active ? '#f2ede6' : '#555',
                                borderLeft: active ? '2px solid #E8002D' : '2px solid transparent',
                                paddingLeft: '6px',
                                transition: 'color 0.2s, border-color 0.2s',
                                whiteSpace: 'nowrap'
                            }}>
                            {link.label}
                        </Link>
                    )
                })}
            </div>

            {/* Bottom year stamp */}
            <div className="nav-stamp" style={{
                writingMode: 'vertical-lr',
                transform: 'rotate(180deg)',
                fontSize: '9px',
                letterSpacing: '2px',
                color: '#ffffffff',
                fontFamily: 'Barlow Condensed, sans-serif',
            }}>1950 — 2026</div>

        </nav>
    )
}