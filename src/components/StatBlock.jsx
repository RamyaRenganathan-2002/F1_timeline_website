import { useCountUp } from '../hooks/useCountUp'

export default function StatBlock({ label, value, color, borderRight = false, onClick }) {
    const numeric = typeof value === 'string'
        ? parseInt(value.replace(/,/g, '')) : (value || 0)
    const { count, ref } = useCountUp(numeric, 1800)

    return (
        <div ref={ref} onClick={onClick} style={{
            padding: '16px 28px',
            borderRight: borderRight ? '1px solid var(--border)' : 'none',
            cursor: onClick ? 'pointer' : 'default',
            transition: 'background 0.15s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
        }}
            onMouseEnter={e => { if (onClick) e.currentTarget.style.background = 'var(--bg-surface)' }}
            onMouseLeave={e => { if (onClick) e.currentTarget.style.background = 'transparent' }}
        >
            <div className="section-label" style={{ margin: 0 }}>
                {label}
                {onClick && <span style={{ marginLeft: '6px', fontSize: '9px' }}>↓</span>}
            </div>
            <div style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '32px', fontWeight: 800,
                lineHeight: 1,
                color: color || 'var(--text-primary)',
            }}>{count.toLocaleString()}</div>
        </div>
    )
}