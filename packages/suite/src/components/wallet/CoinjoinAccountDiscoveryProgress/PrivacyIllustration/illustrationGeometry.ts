import { type FetchIdentityIndex } from '@trezor/coinjoin';
import { typedObjectKeys } from '@trezor/utils';

// ViewBox units are CSS pixels: the art is never scaled, a narrow card crops the tangle at the sides.
export const VIEW_WIDTH = 760;
export const VIEW_HEIGHT = 248;
export const CENTER_X = VIEW_WIDTH / 2;

// The computer group is drawn in local coordinates and shifted down by this offset.
export const COMPUTER_OFFSET_Y = 14;
export const LID = { left: 286, right: 474, top: 22, bottom: 140 };
export const PORT_LOCAL_Y = 81;
export const PORT = { x: LID.left, y: PORT_LOCAL_Y + COMPUTER_OFFSET_Y };
// Tor uses one primary entry guard for all circuits, so every route of ours passes it first.
export const GUARD = { x: LID.left - 32, y: PORT.y };

export const CELL_SIZE = 6.5;
export const CELL_PITCH = 9;
const GRID_COLUMNS = 10;
const GRID_ROWS = 5;
const GRID_X = 350.5;
const GRID_Y = 46.5;
export const GRID = {
    columns: GRID_COLUMNS,
    rows: GRID_ROWS,
    x: GRID_X,
    y: GRID_Y,
    width: CELL_SIZE + (GRID_COLUMNS - 1) * CELL_PITCH,
    height: CELL_SIZE + (GRID_ROWS - 1) * CELL_PITCH,
    centerX: GRID_X + (CELL_SIZE + (GRID_COLUMNS - 1) * CELL_PITCH) / 2,
    centerY: GRID_Y + (CELL_SIZE + (GRID_ROWS - 1) * CELL_PITCH) / 2,
};
// The next batch queues in two columns on the same lattice, left of the grid.
export const QUEUE_X = GRID.x - 3 * CELL_PITCH;
export const TRAY = { y: 115, firstDotX: 393, dotSpacing: 8.5, maxDots: 6 };
export const ADDRESS_PILLS = [
    { x: 323.5, width: 14 },
    { x: 341.5, width: 21 },
    { x: 366.5, width: 9 },
];
export const SEPARATOR = { x1: 323.5, x2: 439, y: 104 };
export const OPENED_BLOCK = { centerX: GRID.centerX, centerY: 68 };
export const BLOCK_ROW_WIDTHS = [30, 24, 32, 21, 28, 26, 31, 22];
export const SCREEN_CLIP = { x: 287.5, y: 23.5, width: 185, height: 115, radius: 9 };

export const LABEL_LINE_HEIGHT = 14;
// Bounding box of one 12 px label line: 15 px tall, the baseline 11 px below its top.
export const LABEL_BOX = { height: 15, ascent: 11 };

export const MAX_LIT_RELAYS = 3;
export const MAX_MATCH_CELLS = 3;
export const MAX_ASH_FLAKES = 20;

export type CircuitKey = `circuit${FetchIdentityIndex}`;
export type RouteKey = 'stream' | CircuitKey;
export type Point = [number, number];

export type Relay = {
    x: number;
    y: number;
    radius: number;
    opacity: number;
    side: -1 | 1;
    band: number;
    load: number;
    route?: RouteKey | 'guard';
};

export type Wire = {
    path: string;
    side: -1 | 1;
    isStub: boolean;
    opacity: number;
    width: number;
};

export type Route = {
    key: RouteKey;
    // From the port through the guard to the edge of the card.
    path: string;
    // The same route from the guard on, drawn on top of the shared trunk.
    branch: string;
    hops: Relay[];
};

export type Tangle = {
    wires: Wire[];
    relays: Relay[];
    routes: Record<RouteKey, Route>;
};

export const getCircuitKey = (identity: FetchIdentityIndex): CircuitKey =>
    `circuit${identity}` as const;

export const getColumnX = (column: number) => GRID.x + column * CELL_PITCH;

export const getRowY = (row: number) => GRID.y + row * CELL_PITCH;

export const getBlockRowY = (row: number) => -17 + row * 5.6;

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Where `value` lies between `start` and `end`, clamped to 0..1. Also defined for open-ended
 * phases (both ends Infinity while a fetch is still running) and for falling ramps.
 */
export const progressBetween = (value: number, start: number, end: number) => {
    const length = end - start;

    if (length && !Number.isNaN(length)) {
        return clamp01((value - start) / length);
    }

    return value >= start ? 1 : 0;
};

export const lerp = (from: number, to: number, fraction: number) => from + (to - from) * fraction;

export const easeInOut = (fraction: number) =>
    fraction < 0.5 ? 2 * fraction * fraction : 1 - Math.pow(-2 * fraction + 2, 2) / 2;

export const invertEaseInOut = (eased: number) =>
    eased < 0.5 ? Math.sqrt(eased / 2) : 1 - Math.sqrt((1 - eased) / 2);

export const easeOut = (fraction: number) => 1 - Math.pow(1 - fraction, 3);

export const easeIn = (fraction: number) => fraction * fraction;

export const formatCoordinate = (value: number) => value.toFixed(1);

// Deterministic, so the tangle and the sampled ash flakes are the same on every render.
const createRandom = (seed: number) => {
    let state = seed;

    return () => {
        state |= 0;
        state = (state + 0x6d2b79f5) | 0;
        let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
        mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;

        return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    };
};

export const hashUnit = (a: number, b: number, c = 0) =>
    createRandom((a * 73856093) ^ (b * 19349663) ^ (c * 83492791))();

type SmoothPathOptions = {
    // Phantom point before the first one, sets the starting tangent.
    previous?: Point;
    // Continue an existing path instead of starting a new one.
    isContinuation?: boolean;
};

// Catmull-Rom spline through the points as cubic Béziers. The curve passes through every point, so
// a wire really goes through the centre of each relay it uses.
const getSmoothPath = (points: Point[], { previous, isContinuation }: SmoothPathOptions = {}) => {
    const [first] = points;
    let path =
        first && !isContinuation
            ? `M${formatCoordinate(first[0])} ${formatCoordinate(first[1])}`
            : '';

    for (let index = 0; index < points.length - 1; index++) {
        const current = points[index];
        const next = points[index + 1];

        if (!current || !next) break;

        const before = points[index - 1] ?? previous ?? current;
        const after = points[index + 2] ?? next;
        const control1 = [
            current[0] + (next[0] - before[0]) / 6,
            current[1] + (next[1] - before[1]) / 6,
        ];
        const control2 = [
            next[0] - (after[0] - current[0]) / 6,
            next[1] - (after[1] - current[1]) / 6,
        ];
        path += ` C${control1.map(formatCoordinate).join(' ')} ${control2.map(formatCoordinate).join(' ')} ${formatCoordinate(next[0])} ${formatCoordinate(next[1])}`;
    }

    return path;
};

// Our five circuits (filters on the default identity, blocks on four identities) all head left: the
// one server at the far end is reached via its .onion address, so no circuit has an exit relay.
const ROUTE_PLAN: { key: RouteKey; endY: number }[] = [
    { key: 'circuit0', endY: 18 },
    { key: 'stream', endY: 70 },
    { key: 'circuit1', endY: 128 },
    { key: 'circuit3', endY: 176 },
    { key: 'circuit2', endY: 226 },
];
// Distance from the centre of each route's own two relays. The first sits close to port height, so
// the routes leave the guard as a loose bundle and only fray further out.
const ROUTE_BANDS = [
    [170, 202],
    [238, 300],
] as const;
const BACKGROUND_BANDS = [
    [114, 160],
    [190, 246],
    [270, 334],
] as const;
const BACKGROUND_RELAY_COUNTS = { left: [4, 4, 4], right: [3, 4, 3] };
const BACKGROUND_WIRE_COUNTS = { left: 19, right: 16 };
const TANGLE_SEED = 0x2b7e15;

const generateTangle = (seed: number): Tangle => {
    const random = createRandom(seed);
    const randomBetween = (min: number, max: number) => min + (max - min) * random();
    const clampY = (y: number) => Math.min(238, Math.max(10, y));
    const getFarX = (side: -1 | 1) => CENTER_X + side * (VIEW_WIDTH / 2 + 26);
    const relays: Relay[] = [];
    const isTooClose = (x: number, y: number, distance = 17) =>
        relays.some(relay => Math.hypot(relay.x - x, relay.y - y) < distance);
    const getBendPoint = (from: Point, to: Point, amplitude: number): Point => {
        const dx = to[0] - from[0];
        const dy = to[1] - from[1];
        const length = Math.hypot(dx, dy) || 1;
        const offset = randomBetween(-amplitude, amplitude);

        return [
            (from[0] + to[0]) / 2 + (-dy / length) * offset,
            clampY((from[1] + to[1]) / 2 + (dx / length) * offset),
        ];
    };
    const getLastPoint = (points: Point[]) => points[points.length - 1] ?? [CENTER_X, PORT.y];

    // 1) Our circuits: port, the shared guard, two relays of their own, off the card.
    const guard: Relay = {
        ...GUARD,
        radius: 2.9,
        opacity: 1,
        side: -1,
        band: 0,
        load: 99,
        route: 'guard',
    };
    relays.push(guard);

    const routeEntries = ROUTE_PLAN.map(({ key, endY }): [RouteKey, Route] => {
        const hops: Relay[] = [guard];
        const hopPlan = [
            { band: 0, fraction: 0.2, jitter: 9 },
            { band: 1, fraction: 0.72, jitter: 18 },
        ] as const;

        hopPlan.forEach(({ band, fraction, jitter }) => {
            let x: number;
            let y: number;
            let tries = 0;

            do {
                x = CENTER_X - randomBetween(ROUTE_BANDS[band][0], ROUTE_BANDS[band][1]);
                y = clampY(lerp(GUARD.y, endY, fraction) + randomBetween(-jitter, jitter));
            } while (isTooClose(x, y, 19) && ++tries < 40);

            const relay: Relay = {
                x,
                y,
                radius: randomBetween(1.7, 2.5),
                opacity: randomBetween(0.75, 1),
                side: -1,
                band: band + 1,
                load: 1,
                route: key,
            };
            relays.push(relay);
            hops.push(relay);
        });

        const points: Point[] = [[GUARD.x, GUARD.y]];
        hops.slice(1).forEach(hop => {
            points.push(
                getBendPoint(getLastPoint(points), [hop.x, hop.y], hop.band === 1 ? 5 : 12),
            );
            points.push([hop.x, hop.y]);
        });
        const end: Point = [getFarX(-1), endY];
        points.push(getBendPoint(getLastPoint(points), end, 26));
        points.push(end);

        // A phantom point level with the next one: the curve leaves the guard horizontally.
        const previous: Point = [GUARD.x + 24, points[1]?.[1] ?? GUARD.y];
        const branch = getSmoothPath(points, { previous });
        const path = `M${PORT.x} ${PORT.y} L${GUARD.x} ${GUARD.y}${getSmoothPath(points, { previous, isContinuation: true })}`;

        return [key, { key, path, branch, hops }];
    });

    // 2) The rest of the Tor network: loose bands of relays, uneven per side.
    ([-1, 1] as const).forEach(side => {
        const counts = side < 0 ? BACKGROUND_RELAY_COUNTS.left : BACKGROUND_RELAY_COUNTS.right;

        BACKGROUND_BANDS.forEach((band, bandIndex) => {
            const count = counts[bandIndex] ?? 0;
            const slot = (VIEW_HEIGHT - 28) / count;

            for (let index = 0; index < count; index++) {
                const x = CENTER_X + side * randomBetween(band[0], band[1]);
                const y = 16 + slot * (index + randomBetween(0.12, 0.88));

                if (isTooClose(x, y)) continue;

                relays.push({
                    x,
                    y,
                    radius: randomBetween(1.1, 2.1),
                    opacity: randomBetween(0.4, 1),
                    side,
                    band: bandIndex,
                    load: 0,
                });
            }
        });
    });

    // 3) Background wires from behind the computer through 1-3 relays (at most 4 wires per relay).
    // Their exits spread 10-40 px from the lid and fade into the haze, so no knot forms there.
    const wires: Wire[] = [];
    ([-1, 1] as const).forEach(side => {
        const count = side < 0 ? BACKGROUND_WIRE_COUNTS.left : BACKGROUND_WIRE_COUNTS.right;

        for (let index = 0; index < count; index++) {
            const startY = randomBetween(30, 136) + COMPUTER_OFFSET_Y;
            const edgeX = side < 0 ? LID.left : LID.right;
            const points: Point[] = [
                [
                    CENTER_X + side * randomBetween(30, 70),
                    Math.min(
                        134 + COMPUTER_OFFSET_Y,
                        Math.max(34 + COMPUTER_OFFSET_Y, startY + randomBetween(-24, 24)),
                    ),
                ],
                [edgeX, startY],
                [edgeX + side * randomBetween(10, 40), clampY(startY + randomBetween(-14, 14))],
            ];
            let currentY = startY;
            let usedRelays = 0;

            for (let band = 0; band < 3; band++) {
                if (band > 0 && random() < 0.24) continue;

                const aimY = currentY + randomBetween(-75, 75);
                const relay = relays
                    .filter(
                        candidate =>
                            candidate.side === side &&
                            candidate.band === band &&
                            candidate.load < 4 &&
                            !candidate.route,
                    )
                    .toSorted((a, b) => Math.abs(a.y - aimY) - Math.abs(b.y - aimY))[0];

                if (!relay) continue;

                relay.load++;
                usedRelays++;
                points.push(getBendPoint(getLastPoint(points), [relay.x, relay.y], 32));
                points.push([relay.x, relay.y]);
                currentY = relay.y;
            }

            const isStub = usedRelays > 0 && random() < 0.26;

            if (isStub) {
                const last = getLastPoint(points);
                points.push([
                    last[0] + side * randomBetween(28, 58),
                    clampY(last[1] + randomBetween(-26, 26)),
                ]);
            } else {
                const end: Point = [getFarX(side), clampY(currentY + randomBetween(-90, 90))];
                points.push(getBendPoint(getLastPoint(points), end, 34));
                points.push(end);
            }

            wires.push({
                path: getSmoothPath(points),
                side,
                isStub,
                opacity: randomBetween(0.4, 1),
                width: randomBetween(0.6, 1.1),
            });
        }
    });

    // Rings only where wires really meet: unused relays go, and so do half of the single-wire ones
    // (the wire still bends there), so it doesn't read as a diagram.
    const visibleRelays = relays.filter(
        relay => !!relay.route || relay.load > 1 || (relay.load === 1 && random() < 0.5),
    );

    return {
        wires,
        relays: visibleRelays,
        routes: Object.fromEntries(routeEntries) as Record<RouteKey, Route>,
    };
};

export const TANGLE = generateTangle(TANGLE_SEED);

export const ROUTE_KEYS = typedObjectKeys(TANGLE.routes);

export const OWN_RELAYS = TANGLE.relays.filter(relay => !!relay.route);

export const ROUTE_SAMPLES = 240;

// A route measured once in the DOM: its length and evenly spaced points along it.
export type MeasuredRoute = {
    key: RouteKey;
    path: string;
    length: number;
    samples: Point[];
    hops: Relay[];
    hopDistances: number[];
};

export const getPointOnRoute = (route: MeasuredRoute, distance: number): Point => {
    const position = clamp01(distance / route.length) * ROUTE_SAMPLES;
    const index = Math.floor(position);
    const from = route.samples[index] ?? [0, 0];
    const to = route.samples[Math.min(ROUTE_SAMPLES, index + 1)] ?? from;

    return [lerp(from[0], to[0], position - index), lerp(from[1], to[1], position - index)];
};

export const getDistanceOnRoute = (
    route: Pick<MeasuredRoute, 'length' | 'samples'>,
    point: Point,
) => {
    let closest = 0;
    let closestDistance = Infinity;

    route.samples.forEach(([x, y], index) => {
        const distance = (x - point[0]) ** 2 + (y - point[1]) ** 2;

        if (distance < closestDistance) {
            closestDistance = distance;
            closest = index;
        }
    });

    return (closest / ROUTE_SAMPLES) * route.length;
};
