const MIN_ALLOWED_HEIGHT = 2;
const BAR_BORDER_RADIUS = 2;

interface GraphBarProps {
    filter?: string;
    fill?: string;
    height?: number;
    value?: number;
    width?: number;
    x?: number;
    y?: number;
}

export const GraphBar = ({ filter, fill, x, y, width, height, value }: GraphBarProps) => {
    if (
        x === undefined ||
        y === undefined ||
        width === undefined ||
        height === undefined ||
        value === undefined ||
        Number.isNaN(height) ||
        height === 0 ||
        value === 0
    ) {
        return null;
    }

    let forcedHeightChange = false;
    let minHeight = height;

    if (Math.abs(height) < MIN_ALLOWED_HEIGHT) {
        minHeight = MIN_ALLOWED_HEIGHT;
        forcedHeightChange = true;
    }

    const diffPosY = forcedHeightChange ? Math.abs(minHeight) - Math.abs(height) : 0;
    const yStartDrawingPoint = forcedHeightChange ? y + minHeight - diffPosY : y + minHeight;

    const path = `
    M${x},${yStartDrawingPoint}
    v-${minHeight - BAR_BORDER_RADIUS}
    q0, ${-BAR_BORDER_RADIUS} ${BAR_BORDER_RADIUS}, ${-BAR_BORDER_RADIUS}
    h${width - 2 * BAR_BORDER_RADIUS}
    q${BAR_BORDER_RADIUS}, 0 ${BAR_BORDER_RADIUS}, ${BAR_BORDER_RADIUS}
    v${minHeight - BAR_BORDER_RADIUS}
    z`;

    return <path fill={fill} d={path} filter={filter} />;
};
