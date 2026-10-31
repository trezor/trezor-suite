import { type Ref } from 'react';

import {
    COMPUTER_OFFSET_Y,
    GUARD,
    LID,
    PORT,
    ROUTE_KEYS,
    TANGLE,
    VIEW_HEIGHT,
    VIEW_WIDTH,
    formatCoordinate,
} from './illustrationGeometry';

// Card-coloured haze at both lid edges: background wires fade out before they reach the computer,
// so no bright knots form there and our one port reads clearly.
const HAZE = { rx: 40, ry: 104, cy: PORT.y };

type IllustrationStaticLayerProps = {
    ref: Ref<SVGSVGElement>;
    idPrefix: string;
    computerLabel: string;
};

/**
 * Drawn once: the Tor network around us, our routes at rest and this computer. The renderer only
 * hides the resting copy of a route while that route is lit on the layer above.
 */
export const IllustrationStaticLayer = ({
    ref,
    idPrefix,
    computerLabel,
}: IllustrationStaticLayerProps) => {
    const inkId = `${idPrefix}-static-ink`;
    const stubLeftId = `${idPrefix}-stub-left`;
    const stubRightId = `${idPrefix}-stub-right`;
    const hazeId = `${idPrefix}-haze`;
    const inkStroke = `url(#${inkId})`;

    return (
        <svg
            ref={ref}
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
            focusable="false"
        >
            <defs>
                {/* Edge fade; x1 and x2 follow the visible, possibly cropped part of the viewBox. */}
                <linearGradient
                    id={inkId}
                    data-view-gradient
                    gradientUnits="userSpaceOnUse"
                    x1="0"
                    y1="0"
                    x2={VIEW_WIDTH}
                    y2="0"
                >
                    <stop offset="0" stopOpacity="0" style={{ stopColor: 'var(--art-ink)' }} />
                    <stop offset="0.14" stopOpacity="1" style={{ stopColor: 'var(--art-ink)' }} />
                    <stop offset="0.86" stopOpacity="1" style={{ stopColor: 'var(--art-ink)' }} />
                    <stop offset="1" stopOpacity="0" style={{ stopColor: 'var(--art-ink)' }} />
                </linearGradient>
                {/* Short strands that end inside the card taper out towards their far end. */}
                <linearGradient id={stubLeftId} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopOpacity="0" style={{ stopColor: 'var(--art-ink)' }} />
                    <stop offset="0.6" stopOpacity="1" style={{ stopColor: 'var(--art-ink)' }} />
                </linearGradient>
                <linearGradient id={stubRightId} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0.4" stopOpacity="1" style={{ stopColor: 'var(--art-ink)' }} />
                    <stop offset="1" stopOpacity="0" style={{ stopColor: 'var(--art-ink)' }} />
                </linearGradient>
                <radialGradient id={hazeId} cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0" stopOpacity="1" style={{ stopColor: 'var(--art-card)' }} />
                    <stop offset="0.5" stopOpacity="0.9" style={{ stopColor: 'var(--art-card)' }} />
                    <stop offset="1" stopOpacity="0" style={{ stopColor: 'var(--art-card)' }} />
                </radialGradient>
            </defs>

            {TANGLE.wires.map(wire => {
                let stroke = inkStroke;
                if (wire.isStub) stroke = `url(#${wire.side < 0 ? stubLeftId : stubRightId})`;

                return (
                    <path
                        key={wire.path}
                        d={wire.path}
                        className="art-wire"
                        stroke={stroke}
                        strokeWidth={wire.width.toFixed(2)}
                        style={{
                            strokeOpacity: `calc(${wire.opacity.toFixed(2)} * var(--art-wire-alpha))`,
                        }}
                    />
                );
            })}
            {TANGLE.relays
                .filter(relay => !relay.route)
                .map(relay => (
                    <circle
                        key={`${relay.x}-${relay.y}`}
                        cx={formatCoordinate(relay.x)}
                        cy={formatCoordinate(relay.y)}
                        r={relay.radius.toFixed(2)}
                        className="art-relay"
                        stroke={inkStroke}
                        strokeWidth={1}
                        style={{
                            strokeOpacity: `calc(${relay.opacity.toFixed(2)} * var(--art-relay-alpha))`,
                        }}
                    />
                ))}
            <ellipse
                cx={LID.left}
                cy={HAZE.cy}
                rx={HAZE.rx}
                ry={HAZE.ry}
                fill={`url(#${hazeId})`}
            />
            <ellipse
                cx={LID.right}
                cy={HAZE.cy}
                rx={HAZE.rx}
                ry={HAZE.ry}
                fill={`url(#${hazeId})`}
            />

            {/* Our routes at rest: the shared trunk to the guard once, then each branch. */}
            <path
                d={`M${PORT.x} ${PORT.y} L${GUARD.x} ${GUARD.y}`}
                className="art-wire"
                stroke={inkStroke}
                strokeWidth={1.1}
                style={{ strokeOpacity: 'calc(0.95 * var(--art-wire-alpha))' }}
            />
            {ROUTE_KEYS.map(key => (
                <path
                    key={key}
                    data-route-base={key}
                    d={TANGLE.routes[key].branch}
                    className="art-wire"
                    stroke={inkStroke}
                    strokeWidth={0.9}
                    style={{ strokeOpacity: 'calc(0.72 * var(--art-wire-alpha))' }}
                />
            ))}
            {TANGLE.relays
                .filter(relay => !!relay.route)
                .map(relay => (
                    <circle
                        key={`${relay.x}-${relay.y}`}
                        cx={formatCoordinate(relay.x)}
                        cy={formatCoordinate(relay.y)}
                        r={relay.radius.toFixed(2)}
                        className="art-relay"
                        stroke={inkStroke}
                        strokeWidth={relay.route === 'guard' ? 1.2 : 1}
                        style={{
                            strokeOpacity: `calc(${relay.opacity.toFixed(2)} * var(--art-relay-alpha))`,
                        }}
                    />
                ))}

            {/* This computer, in local coordinates. */}
            <g transform={`translate(0 ${COMPUTER_OFFSET_Y})`} strokeLinejoin="round">
                <path
                    d="M256 145 H504 V147.6 Q504 151.6 500 151.6 H260 Q256 151.6 256 147.6 Z"
                    className="art-outline"
                    strokeWidth={1.4}
                />
                <path
                    d="M352 145 v0.5 q0 2.3 2.3 2.3 h51.4 q2.3 0 2.3 -2.3 v-0.5"
                    className="art-glyph-line"
                    strokeWidth={1.2}
                />
                <rect
                    x={LID.left}
                    y={LID.top}
                    width={LID.right - LID.left}
                    height={LID.bottom - LID.top}
                    rx={10}
                    className="art-card-fill"
                />
                <rect
                    x={LID.left}
                    y={LID.top}
                    width={LID.right - LID.left}
                    height={LID.bottom - LID.top}
                    rx={10}
                    className="art-screen"
                    strokeWidth={1.4}
                />
                <circle
                    cx={(LID.left + LID.right) / 2}
                    cy={29.5}
                    r={1}
                    className="art-glyph-fill"
                    opacity={0.6}
                />
                {/* The one port all our Tor traffic leaves through. */}
                <rect
                    x={283.4}
                    y={77}
                    width={3.2}
                    height={8}
                    rx={1.3}
                    className="art-outline"
                    strokeWidth={1}
                />
                <text x={(LID.left + LID.right) / 2} y={174} textAnchor="middle">
                    {computerLabel}
                </text>
            </g>
        </svg>
    );
};
