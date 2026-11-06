import { type SkPath, type SkPoint, Skia } from '@shopify/react-native-skia';

import type {
    GraphPathRange,
    GraphPoint,
    GraphRange,
    GraphXRange,
    GraphYRange,
} from './LineGraphProps';

type GraphPathConfig = {
    /**
     * Graph Points to use for the Path. Will be normalized and centered.
     */
    pointsInRange: GraphPoint[];
    /**
     * Optional Padding (left, right) for the Graph to correctly round the Path.
     */
    horizontalPadding: number;
    /**
     * Optional Padding (top, bottom) for the Graph to correctly round the Path.
     */
    verticalPadding: number;
    /**
     * Height of the Canvas (Measured with onLayout)
     */
    canvasHeight: number;
    /**
     * Width of the Canvas (Measured with onLayout)
     */
    canvasWidth: number;
    /**
     * Range of the graph's x and y-axis
     */
    range: GraphPathRange;
};

type GraphPathConfigWithGradient = GraphPathConfig & {
    shouldFillGradient: true;
};
type GraphPathConfigWithoutGradient = GraphPathConfig & {
    shouldFillGradient: false;
};

export function getGraphPathRange(points: GraphPoint[], range?: GraphRange): GraphPathRange {
    const minValueX = range?.x?.min ?? points[0]?.date ?? new Date();
    const maxValueX = range?.x?.max ?? points[points.length - 1]?.date ?? new Date();

    const minValueY =
        range?.y?.min ??
        points.reduce(
            (prev, curr) => (curr.value < prev ? curr.value : prev),
            Number.MAX_SAFE_INTEGER,
        );
    const maxValueY =
        range?.y?.max ??
        points.reduce(
            (prev, curr) => (curr.value > prev ? curr.value : prev),
            Number.MIN_SAFE_INTEGER,
        );

    return {
        x: { min: minValueX, max: maxValueX },
        y: { min: minValueY, max: maxValueY },
    };
}

export const getXPositionInRange = (date: Date, xRange: GraphXRange): number => {
    const diff = xRange.max.getTime() - xRange.min.getTime();
    const x = date.getTime();

    return (x - xRange.min.getTime()) / diff;
};

export const getXInRange = (width: number, date: Date, xRange: GraphXRange): number =>
    Math.floor(width * getXPositionInRange(date, xRange));

export const getYPositionInRange = (value: number, yRange: GraphYRange): number => {
    if (yRange.min === yRange.max) return 0.5; // Prevent division by zero (NaN)

    const diff = yRange.max - yRange.min;
    const y = value;

    return (y - yRange.min) / diff;
};

export const getYInRange = (height: number, value: number, yRange: GraphYRange): number =>
    Math.floor(height * getYPositionInRange(value, yRange));

export const getPointsInRange = (allPoints: GraphPoint[], range: GraphPathRange) =>
    allPoints.filter(point => {
        const portionFactorX = getXPositionInRange(point.date, range.x);

        return portionFactorX <= 1 && portionFactorX >= 0;
    });

const getSlope = (from: SkPoint, to: SkPoint) => {
    const dx = to.x - from.x;

    return dx === 0 ? 0 : (to.y - from.y) / dx;
};

// Steffen's monotone tangents: the curve passes through every point and never overshoots them.
const getMonotoneTangents = (points: SkPoint[]): number[] =>
    points.map((point, i) => {
        const prev = points[i - 1];
        const next = points[i + 1];

        if (prev == null) return next == null ? 0 : getSlope(point, next);
        if (next == null) return getSlope(prev, point);

        const prevWidth = point.x - prev.x;
        const nextWidth = next.x - point.x;
        const prevSlope = getSlope(prev, point);
        const nextSlope = getSlope(point, next);
        const widthSum = prevWidth + nextWidth;
        const parabolaSlope =
            widthSum === 0 ? 0 : (prevSlope * nextWidth + nextSlope * prevWidth) / widthSum;

        return (
            (Math.sign(prevSlope) + Math.sign(nextSlope)) *
            Math.min(Math.abs(prevSlope), Math.abs(nextSlope), Math.abs(parabolaSlope) / 2)
        );
    });

type GraphPathWithGradient = { path: SkPath; gradientPath: SkPath };

function createGraphPathBase(props: GraphPathConfigWithGradient): GraphPathWithGradient;
function createGraphPathBase(props: GraphPathConfigWithoutGradient): SkPath;

function createGraphPathBase({
    pointsInRange: graphData,
    range,
    horizontalPadding,
    verticalPadding,
    canvasHeight: height,
    canvasWidth: width,
    shouldFillGradient,
}: GraphPathConfigWithGradient | GraphPathConfigWithoutGradient): SkPath | GraphPathWithGradient {
    const pathBuilder = Skia.PathBuilder.Make();

    // Canvas width substracted by the horizontal padding => Actual drawing width
    const drawingWidth = width - 2 * horizontalPadding;
    // Canvas height substracted by the vertical padding => Actual drawing height
    const drawingHeight = height - 2 * verticalPadding;

    if (graphData[0] == null) {
        return pathBuilder.build();
    }

    const points: SkPoint[] = graphData.map(({ date, value }) => ({
        x: drawingWidth * getXPositionInRange(date, range.x) + horizontalPadding,
        y: drawingHeight - getYInRange(drawingHeight, value, range.y) + verticalPadding,
    }));
    const tangents = getMonotoneTangents(points);

    for (let i = 0; i < points.length; i++) {
        const point = points[i]!;
        const prev = points[i - 1];

        if (prev == null) {
            pathBuilder.moveTo(point.x, point.y);
            continue;
        }

        const third = (point.x - prev.x) / 3;

        pathBuilder.cubicTo(
            prev.x + third,
            prev.y + tangents[i - 1]! * third,
            point.x - third,
            point.y - tangents[i]! * third,
            point.x,
            point.y,
        );
    }

    if (!shouldFillGradient) {
        return pathBuilder.build();
    }

    const path = pathBuilder.build();

    pathBuilder.lineTo(points.at(-1)!.x, height + verticalPadding);
    pathBuilder.lineTo(horizontalPadding, height + verticalPadding);

    return { path, gradientPath: pathBuilder.build() };
}

export function createGraphPath(props: GraphPathConfig): SkPath {
    return createGraphPathBase({ ...props, shouldFillGradient: false });
}

export function createGraphPathWithGradient(props: GraphPathConfig): GraphPathWithGradient {
    return createGraphPathBase({
        ...props,
        shouldFillGradient: true,
    });
}
