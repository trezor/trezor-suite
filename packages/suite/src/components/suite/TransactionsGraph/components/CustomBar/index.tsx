import React from 'react';

// the min-allowed-height of the bar should be equal to (or higher than) the border radius
// if the min-height is lower than the border-radius, the bar of such a min-height won't be visible
const MIN_ALLOWED_HEIGHT = 2;
const BAR_BORDER_RADIUS = 2;

interface CustomBarProps {
    variant: 'sent' | 'received';
    filter?: string;
    [key: string]: any;
}

const CustomBar = (props: CustomBarProps) => {
    const { fill, x, y, width, height } = props;

    // ignore bars with NaN or 0 height (case where sent/received values are zero)
    if (Number.isNaN(height) || height === 0 || props.value === 0) return null;

    let forcedHeightChange = false;
    let minHeight = height;

    if (Math.abs(height) < MIN_ALLOWED_HEIGHT && props.value !== 0) {
        // make sure small amounts are visible by forcing minHeight of 2 if abs(amount) < 1
        // minHeight = variant === 'sent' ? -2 : 2; // useful if we want to show sent bars below the y = 0
        minHeight = MIN_ALLOWED_HEIGHT;
        forcedHeightChange = true;
    }

    // This is the difference in actual height of the bar and MIN_ALLOWED_HEIGHT
    const diffPosY = forcedHeightChange ? Math.abs(minHeight) - Math.abs(height) : 0;

    // this is the y-coordinate of the starting point for drawing the bar
    // minHeight is the height of the bar
    // y is the empty vertical space between the bar and the container
    const yStartDrawingPoint = forcedHeightChange ? y + minHeight - diffPosY : y + minHeight;

    // When drawing the path, first move the pen to the bottom-left corner of the bar (M${x},${y}) and then draw vertical line up (v${-length}), then continue...
    // Tutorial about SVG coordinate system: https://medium.com/@dennismphil/one-side-rounded-rectangle-using-svg-fb31cf318d90

    const path = `
    M${x},${yStartDrawingPoint}  
    v-${minHeight - BAR_BORDER_RADIUS}
    q0, ${-BAR_BORDER_RADIUS} ${BAR_BORDER_RADIUS}, ${-BAR_BORDER_RADIUS}
    h${width - 2 * BAR_BORDER_RADIUS}
    q${BAR_BORDER_RADIUS}, 0 ${BAR_BORDER_RADIUS}, ${BAR_BORDER_RADIUS}
    v${minHeight - BAR_BORDER_RADIUS}
    z`;

    return <path fill={fill} d={path} filter={props.filter} />;
};

export default CustomBar;
