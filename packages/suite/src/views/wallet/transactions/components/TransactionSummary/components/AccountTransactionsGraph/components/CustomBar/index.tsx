import React from 'react';


interface CustomBarProps {
    variant: 'sent' | 'received';
    [key: string]: any;
}

const CustomBar = (props: CustomBarProps) => {
    const { fill, x, y, width, height, payload, variant } = props;
    let forcedHeightChange = false;
    let minHeight = height;
    if (
        (variant === 'sent' && Math.abs(height) < 1 && payload.sent !== '0') ||
        (variant === 'received' && Math.abs(height) < 1 && payload.received !== '0')
    ) {
        // make sure small amounts are visible by forcing minHeight of 2 if abs(amount) < 1
        minHeight = variant === 'sent' ? -2 : 2;
        forcedHeightChange = true;
    }

    const diffPosY = forcedHeightChange ? Math.abs(minHeight) - Math.abs(height) : 0;
    return (
        <rect
            fill={fill}
            x={x}
            y={minHeight < 0 ? y + diffPosY + minHeight : y - diffPosY}
            width={width}
            height={Math.abs(minHeight)}
        />
    );
};

export default CustomBar;
