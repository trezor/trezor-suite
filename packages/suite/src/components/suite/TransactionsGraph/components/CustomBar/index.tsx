import React from 'react';

interface CustomBarProps {
    variant: 'sent' | 'received';
    [key: string]: any;
}

const CustomBar = (props: CustomBarProps) => {
    const { fill, x, y, width, height } = props;
    let forcedHeightChange = false;
    let minHeight = height;
    if (Math.abs(height) < 1 && props.value !== 0) {
        // make sure small amounts are visible by forcing minHeight of 2 if abs(amount) < 1
        // minHeight = variant === 'sent' ? -2 : 2; // useful if we want to show sent bars below the y = 0
        minHeight = 2;
        forcedHeightChange = true;
    }

    const diffPosY = forcedHeightChange ? Math.abs(minHeight) - Math.abs(height) : 0;

    // TODO: https://medium.com/@dennismphil/one-side-rounded-rectangle-using-svg-fb31cf318d90
    return (
        <rect
            fill={fill}
            x={x}
            y={minHeight < 0 ? y + diffPosY + minHeight : y - diffPosY}
            rx={2}
            ry={2}
            width={width}
            height={Math.abs(minHeight)}
        />
    );
};

export default CustomBar;
