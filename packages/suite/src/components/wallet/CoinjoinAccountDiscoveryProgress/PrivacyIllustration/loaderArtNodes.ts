import {
    type MeasuredRoute,
    ROUTE_KEYS,
    ROUTE_SAMPLES,
    type RouteKey,
    TANGLE,
    formatCoordinate,
    getDistanceOnRoute,
} from './illustrationGeometry';

// The renderer finds the SVG nodes it animates by their `data-art` names and writes only their
// attributes, so React renders the illustration once and never re-renders it while animating.

const NODE_NAMES = [
    'streamDots',
    'blink',
    'lit',
    'litGlow',
    'litCore',
    'litHead',
    'trail',
    'packet',
    'cargoBlock',
    'cargoTx',
    'queue',
    'gridGroup',
    'pending',
    'soloColumn',
    'smoulder',
    'checkLine',
    'box',
    'boxGlow',
    'boxHeader',
    'mover',
] as const;

type NodeName = (typeof NODE_NAMES)[number];

// Attribute writes are cached per node, so unchanged values never touch the DOM.
const writtenAttributes = new WeakMap<Element, Map<string, string>>();

export const setAttribute = (node: Element, name: string, value: number | string) => {
    const serialized = typeof value === 'number' ? String(Math.round(value * 100) / 100) : value;
    const cache = writtenAttributes.get(node) ?? new Map<string, string>();

    if (cache.get(name) === serialized) return;

    cache.set(name, serialized);
    writtenAttributes.set(node, cache);
    node.setAttribute(name, serialized);
};

export const setVisible = (node: Element, isVisible: boolean) =>
    setAttribute(node, 'display', isVisible ? 'inline' : 'none');

export const getScaleTransform = (
    scaleX: number,
    scaleY: number,
    originX: number,
    originY: number,
) =>
    `matrix(${scaleX.toFixed(3)} 0 0 ${scaleY.toFixed(3)} ${(originX * (1 - scaleX)).toFixed(2)} ${(originY * (1 - scaleY)).toFixed(2)})`;

export const getTranslate = (x: number, y: number) =>
    `translate(${formatCoordinate(x)} ${formatCoordinate(y)})`;

export const queryAll = (root: Element, name: string) =>
    Array.from(root.querySelectorAll<SVGElement>(`[data-art="${name}"]`));

export const queryNodes = (root: Element) => {
    const entries = NODE_NAMES.map(name => [name, queryAll(root, name)[0]] as const);
    const found = entries.flatMap(([name, node]) => (node ? [[name, node] as const] : []));

    return found.length === NODE_NAMES.length
        ? (Object.fromEntries(found) as Record<NodeName, SVGElement>)
        : null;
};

export const queryPool = <Part extends string>(
    root: Element,
    name: string,
    parts: readonly Part[],
) =>
    queryAll(root, name).map(group => {
        const elements = {} as Record<Part, SVGElement>;
        parts.forEach(part => {
            elements[part] = queryAll(group, part)[0] ?? group;
        });

        return { group, ...elements };
    });

export const measureRoutes = (staticLayer: SVGSVGElement, dynamicLayer: SVGSVGElement) => {
    const measured = ROUTE_KEYS.flatMap(key => {
        const measurePath = dynamicLayer.querySelector<SVGPathElement>(`[data-measure="${key}"]`);
        const base = staticLayer.querySelector<SVGPathElement>(`[data-route-base="${key}"]`);

        // Without SVG geometry (e.g. in jsdom) there is nothing to animate along.
        if (!measurePath || !base || typeof measurePath.getTotalLength !== 'function') return [];

        const length = measurePath.getTotalLength();
        const samples = Array.from({ length: ROUTE_SAMPLES + 1 }, (_, index): [number, number] => {
            const point = measurePath.getPointAtLength((length * index) / ROUTE_SAMPLES);

            return [point.x, point.y];
        });
        const { path, hops } = TANGLE.routes[key];
        const route: MeasuredRoute = {
            key,
            path,
            length,
            samples,
            hops,
            hopDistances: hops.map(hop => getDistanceOnRoute({ length, samples }, [hop.x, hop.y])),
        };

        return [{ route, base }];
    });

    if (measured.length !== ROUTE_KEYS.length) return null;

    return {
        routes: Object.fromEntries(measured.map(({ route }) => [route.key, route])) as Record<
            RouteKey,
            MeasuredRoute
        >,
        bases: Object.fromEntries(measured.map(({ route, base }) => [route.key, base])) as Record<
            RouteKey,
            SVGPathElement
        >,
    };
};
