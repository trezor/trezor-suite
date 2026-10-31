import {
    LABEL_BOX,
    LABEL_LINE_HEIGHT,
    LID,
    type MeasuredRoute,
    OWN_RELAYS,
    type RouteKey,
    VIEW_HEIGHT,
    getPointOnRoute,
} from './illustrationGeometry';

// Labels sit beside the wires, never on them. The obstacles are our five routes and our relays.

export type LabelBox = { x0: number; x1: number; y0: number; y1: number };

export type LabelPlacement = { lines: string[]; centerX: number; baselineY: number; box: LabelBox };

type Candidate = {
    box: LabelBox;
    distance: number;
    offset: number;
    normalY: number;
    centerX: number;
};

type Scored = { score: number; isAllowed: boolean; candidate: Candidate; lines: string[] };

type GetCandidatesParams = {
    route: MeasuredRoute;
    from: number;
    width: number;
    height: number;
    offsets: number[];
    viewLeft: number;
};

type PlaceStreamLabelParams = {
    routes: Record<RouteKey, MeasuredRoute>;
    // One line, plus the two-line variant if the text can be split.
    variants: { lines: string[]; width: number }[];
    viewLeft: number;
};

type PlaceCircuitLabelParams = {
    routes: Record<RouteKey, MeasuredRoute>;
    circuit: RouteKey;
    text: string;
    width: number;
    streamBox: LabelBox | null;
    viewLeft: number;
};

const getMaxLabelX = () => LID.left - 6;

const getMinLabelX = (viewLeft: number) => viewLeft + 10;

const countRouteHits = (route: MeasuredRoute, box: LabelBox, padding: number) =>
    route.samples.filter(
        ([x, y]) =>
            x > box.x0 - padding &&
            x < box.x1 + padding &&
            y > box.y0 - padding &&
            y < box.y1 + padding,
    ).length;

const countRelayHits = (box: LabelBox, padding = 3) =>
    OWN_RELAYS.filter(
        ({ x, y }) =>
            x > box.x0 - padding &&
            x < box.x1 + padding &&
            y > box.y0 - padding &&
            y < box.y1 + padding,
    ).length;

const getBoxGap = (a: LabelBox, b: LabelBox | null) =>
    b
        ? Math.hypot(Math.max(a.x0 - b.x1, b.x0 - a.x1, 0), Math.max(a.y0 - b.y1, b.y0 - a.y1, 0))
        : Infinity;

const getOtherRoutes = (routes: Record<RouteKey, MeasuredRoute>, key: RouteKey) =>
    Object.values(routes).filter(route => route.key !== key);

// Candidate boxes along a route, `offset` px from the wire along its normal, on both sides.
const getCandidates = ({ route, from, width, height, offsets, viewLeft }: GetCandidatesParams) => {
    const candidates: Candidate[] = [];

    for (let distance = from; distance <= route.length; distance += 5) {
        const [x, y] = getPointOnRoute(route, distance);

        if (x < getMinLabelX(viewLeft) - 30) break;

        const [beforeX, beforeY] = getPointOnRoute(route, distance - 5);
        const [afterX, afterY] = getPointOnRoute(route, distance + 5);
        const tangentLength = Math.hypot(afterX - beforeX, afterY - beforeY) || 1;

        [1, -1].forEach(sign => {
            const normalX = (-(afterY - beforeY) / tangentLength) * sign;
            const normalY = ((afterX - beforeX) / tangentLength) * sign;

            offsets.forEach(offset => {
                const support = Math.abs(normalX) * (width / 2) + Math.abs(normalY) * (height / 2);
                const centerX = x + normalX * (offset + support);
                const centerY = y + normalY * (offset + support);
                const box = {
                    x0: centerX - width / 2,
                    x1: centerX + width / 2,
                    y0: centerY - height / 2,
                    y1: centerY + height / 2,
                };
                const isInside =
                    box.x0 >= getMinLabelX(viewLeft) &&
                    box.x1 <= getMaxLabelX() &&
                    box.y0 >= 4 &&
                    box.y1 <= VIEW_HEIGHT - 4;

                if (isInside) candidates.push({ box, distance, offset, normalY, centerX });
            });
        });
    }

    return candidates;
};

// The best allowed candidate, or the best one at all when none is allowed.
const pickBest = (scored: Scored[]) => {
    const pool = scored.some(item => item.isAllowed)
        ? scored.filter(item => item.isAllowed)
        : scored;

    return pool.reduce<Scored | null>(
        (best, item) => (!best || item.score < best.score ? item : best),
        null,
    );
};

const toPlacement = (best: Scored | null): LabelPlacement | null =>
    best && {
        lines: best.lines,
        centerX: best.candidate.centerX,
        baselineY: best.candidate.box.y0 + LABEL_BOX.ascent,
        box: best.candidate.box,
    };

export const placeStreamLabel = ({ routes, variants, viewLeft }: PlaceStreamLabelParams) => {
    const route = routes.stream;
    const otherRoutes = getOtherRoutes(routes, 'stream');
    const room = getMaxLabelX() - getMinLabelX(viewLeft);
    const scored = variants
        .filter(({ width }) => width + 6 <= room)
        .flatMap(({ lines, width }) => {
            const height = (lines.length - 1) * LABEL_LINE_HEIGHT + LABEL_BOX.height;
            const extraLinePenalty = lines.length > 1 ? 3 : 0;

            return getCandidates({
                route,
                from: 6,
                width,
                height,
                offsets: [5, 9, 14],
                viewLeft,
            }).map((candidate): Scored => {
                const ownHits = countRouteHits(route, candidate.box, 3);
                const score =
                    extraLinePenalty +
                    countRelayHits(candidate.box) * 8 +
                    (candidate.distance / route.length) * 6 +
                    (candidate.normalY > 0 ? 1.5 : 0) +
                    candidate.offset * 0.1 +
                    otherRoutes.reduce(
                        (sum, other) => sum + countRouteHits(other, candidate.box, 3.5) * 10,
                        0,
                    );

                // Never on its own dotted wire; as a fallback, the fewer hits the better.
                return {
                    score: ownHits ? score + ownHits * 12 : score,
                    isAllowed: !ownHits,
                    candidate,
                    lines,
                };
            });
        });

    return toPlacement(pickBest(scored));
};

export const placeCircuitLabel = ({
    routes,
    circuit,
    text,
    width,
    streamBox,
    viewLeft,
}: PlaceCircuitLabelParams) => {
    const route = routes[circuit];
    const otherRoutes = getOtherRoutes(routes, circuit);
    const firstHop = route.hopDistances[0] ?? 0;
    const candidates = getCandidates({
        route,
        from: firstHop + 6,
        width,
        height: LABEL_BOX.height,
        offsets: [5, 9, 14, 20],
        viewLeft,
    });
    const scored = candidates.map((candidate): Scored => {
        // Next to its own wire and away from the others, so it can't be read as another circuit's.
        const score =
            countRelayHits(candidate.box) * 8 +
            ((candidate.distance - firstHop) / route.length) * 8 +
            candidate.offset * 0.15 +
            otherRoutes.reduce(
                (sum, other) =>
                    sum +
                    countRouteHits(other, candidate.box, 3) * 10 +
                    countRouteHits(other, candidate.box, 7) * 3,
                0,
            );
        const isAllowed =
            countRouteHits(route, candidate.box, 3) === 0 &&
            countRouteHits(routes.stream, candidate.box, 3) === 0 &&
            getBoxGap(candidate.box, streamBox) >= 6;

        return { score, isAllowed, candidate, lines: [text] };
    });

    return toPlacement(pickBest(scored));
};

// The two-line variant for narrow cards breaks at the space closest to the middle.
export const splitLabel = (text: string) => {
    const middle = text.length / 2;
    const breakAt = text
        .split('')
        .flatMap((char, index) => (char === ' ' ? [index] : []))
        .toSorted((a, b) => Math.abs(a - middle) - Math.abs(b - middle))[0];

    return breakAt === undefined ? null : [text.slice(0, breakAt), text.slice(breakAt + 1)];
};
