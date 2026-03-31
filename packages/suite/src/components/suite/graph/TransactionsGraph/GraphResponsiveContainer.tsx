import { ResponsiveContainer, type ResponsiveContainerProps } from 'recharts';

export const GraphResponsiveContainer = (props: ResponsiveContainerProps) => (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <div
            style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
            }}
        >
            <ResponsiveContainer {...props} />
        </div>
    </div>
);
