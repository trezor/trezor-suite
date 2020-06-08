import React from 'react';
import { ResponsiveContainer, ResponsiveContainerProps } from 'recharts';

// https://github.com/recharts/recharts/issues/1767#issuecomment-598607012
const CustomResponsiveContainer = (props: ResponsiveContainerProps) => {
    return (
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
};

export default CustomResponsiveContainer;
