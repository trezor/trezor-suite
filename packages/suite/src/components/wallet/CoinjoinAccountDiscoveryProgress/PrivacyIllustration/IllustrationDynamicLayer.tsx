import { type Ref } from 'react';

import { type IllustrationPatternIds } from './createLoaderArt';
import {
    ADDRESS_PILLS,
    BLOCK_ROW_WIDTHS,
    CELL_PITCH,
    CELL_SIZE,
    COMPUTER_OFFSET_Y,
    GRID,
    LID,
    MAX_ASH_FLAKES,
    MAX_LIT_RELAYS,
    MAX_MATCH_CELLS,
    QUEUE_X,
    ROUTE_KEYS,
    SCREEN_CLIP,
    SEPARATOR,
    TANGLE,
    TRAY,
    VIEW_HEIGHT,
    VIEW_WIDTH,
    getBlockRowY,
} from './illustrationGeometry';

const BOX_SIZE = { width: 46, height: 62, radius: 4.5 };

const PATTERN_SHAPES = [
    { key: 'square', className: 'art-cell' },
    { key: 'round', className: 'art-cell' },
    { key: 'squareEmber', className: 'art-ember' },
    { key: 'roundEmber', className: 'art-ember' },
    { key: 'squareAsh', className: 'art-ash' },
    { key: 'roundAsh', className: 'art-ash' },
] as const;

type IllustrationDynamicLayerProps = {
    ref: Ref<SVGSVGElement>;
    idPrefix: string;
    patternIds: IllustrationPatternIds;
    description: string;
};

/**
 * Everything that moves. Nodes carry `data-art` names for the renderer, which only writes their
 * attributes; their count is fixed here, so nothing is created while animating.
 */
export const IllustrationDynamicLayer = ({
    ref,
    idPrefix,
    patternIds,
    description,
}: IllustrationDynamicLayerProps) => {
    const ids = {
        ink: `${idPrefix}-ink`,
        lit: `${idPrefix}-lit`,
        keep: `${idPrefix}-keep`,
        smoulder: `${idPrefix}-smoulder`,
        boxGlow: `${idPrefix}-box-glow`,
        screen: `${idPrefix}-screen`,
        outside: `${idPrefix}-outside`,
    };

    return (
        <svg
            ref={ref}
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            preserveAspectRatio="xMidYMid slice"
            role="img"
            aria-label={description}
        >
            <defs>
                <linearGradient
                    id={ids.ink}
                    data-view-gradient
                    gradientUnits="userSpaceOnUse"
                    x1="0"
                    y1="0"
                    x2={VIEW_WIDTH}
                    y2="0"
                >
                    <stop offset="0" stopOpacity="0" style={{ stopColor: 'var(--art-ink)' }} />
                    <stop offset="0.14" stopOpacity="1" style={{ stopColor: 'var(--art-ink)' }} />
                    <stop offset="1" stopOpacity="1" style={{ stopColor: 'var(--art-ink)' }} />
                </linearGradient>
                <linearGradient
                    id={ids.lit}
                    data-view-gradient
                    gradientUnits="userSpaceOnUse"
                    x1="0"
                    y1="0"
                    x2={VIEW_WIDTH}
                    y2="0"
                >
                    <stop offset="0" stopOpacity="0" style={{ stopColor: 'var(--art-violet)' }} />
                    <stop
                        offset="0.12"
                        stopOpacity="1"
                        style={{ stopColor: 'var(--art-violet)' }}
                    />
                    <stop offset="1" stopOpacity="1" style={{ stopColor: 'var(--art-violet)' }} />
                </linearGradient>
                <linearGradient
                    id={ids.keep}
                    data-view-gradient
                    gradientUnits="userSpaceOnUse"
                    x1="0"
                    y1="0"
                    x2={VIEW_WIDTH}
                    y2="0"
                >
                    <stop offset="0" stopOpacity="0" style={{ stopColor: 'var(--art-keep)' }} />
                    <stop offset="0.12" stopOpacity="1" style={{ stopColor: 'var(--art-keep)' }} />
                    <stop offset="1" stopOpacity="1" style={{ stopColor: 'var(--art-keep)' }} />
                </linearGradient>
                {/* A warm haze just behind the check line, the only constant warm light. */}
                <linearGradient id={ids.smoulder} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopOpacity="0" style={{ stopColor: 'var(--art-ember)' }} />
                    <stop offset="1" stopOpacity="0.14" style={{ stopColor: 'var(--art-ember)' }} />
                </linearGradient>
                <radialGradient id={ids.boxGlow} cx="0.5" cy="0.55" r="0.6">
                    <stop offset="0" stopOpacity="0.32" style={{ stopColor: 'var(--art-ember)' }} />
                    <stop offset="1" stopOpacity="0" style={{ stopColor: 'var(--art-ember)' }} />
                </radialGradient>
                {/* One batch of filters is 50 cells, each drawn by a rect with a pattern fill. */}
                {PATTERN_SHAPES.map(({ key, className }) => (
                    <pattern
                        key={key}
                        id={patternIds[key]}
                        patternUnits="userSpaceOnUse"
                        x={GRID.x}
                        y={GRID.y}
                        width={CELL_PITCH}
                        height={CELL_PITCH}
                    >
                        {key.startsWith('round') ? (
                            <circle
                                cx={CELL_SIZE / 2}
                                cy={CELL_SIZE / 2}
                                r={2.7}
                                className={className}
                            />
                        ) : (
                            <rect
                                width={CELL_SIZE}
                                height={CELL_SIZE}
                                rx={1.4}
                                className={className}
                            />
                        )}
                    </pattern>
                ))}
                <clipPath id={ids.screen}>
                    <rect
                        x={SCREEN_CLIP.x}
                        y={SCREEN_CLIP.y}
                        width={SCREEN_CLIP.width}
                        height={SCREEN_CLIP.height}
                        rx={SCREEN_CLIP.radius}
                    />
                </clipPath>
                {/* Lit circuits stay outside the computer, the lid edge is where they end. */}
                <clipPath id={ids.outside}>
                    <rect x={-80} y={-20} width={LID.left + 80.3} height={VIEW_HEIGHT + 52} />
                </clipPath>
            </defs>

            <g visibility="hidden">
                {ROUTE_KEYS.map(key => (
                    <path key={key} data-measure={key} d={TANGLE.routes[key].path} />
                ))}
            </g>

            {/* 1. The filter stream (default identity); its label stays under any lit circuit. */}
            <path
                data-art="streamDots"
                d={TANGLE.routes.stream.path}
                fill="none"
                stroke={`url(#${ids.ink})`}
                strokeWidth={1.8}
                strokeLinecap="round"
            />
            <text data-art="streamLabel" textAnchor="middle" aria-hidden="true" />

            {/* 2. One fully lit circuit at a time, plus a short core blink for compact fetches. */}
            <g clipPath={`url(#${ids.outside})`}>
                <path
                    data-art="blink"
                    fill="none"
                    stroke={`url(#${ids.lit})`}
                    strokeWidth={1.3}
                    strokeLinecap="round"
                    display="none"
                />
                <g data-art="lit" display="none">
                    <path
                        data-art="litGlow"
                        className="art-violet-glow"
                        fill="none"
                        stroke={`url(#${ids.lit})`}
                        strokeWidth={6}
                        strokeLinecap="round"
                    />
                    <path
                        data-art="litCore"
                        fill="none"
                        stroke={`url(#${ids.lit})`}
                        strokeWidth={1.4}
                        strokeLinecap="round"
                    />
                    <path
                        data-art="litHead"
                        fill="none"
                        stroke={`url(#${ids.lit})`}
                        strokeWidth={2.6}
                        strokeLinecap="round"
                    />
                    <path
                        data-art="trail"
                        fill="none"
                        stroke={`url(#${ids.keep})`}
                        strokeWidth={1.7}
                        strokeLinecap="round"
                    />
                    {Array.from({ length: MAX_LIT_RELAYS }, (_, index) => (
                        <g key={index} data-art="litRelay">
                            <circle
                                data-art="litRelayPulse"
                                r={3}
                                className="art-violet-line"
                                strokeWidth={1}
                            />
                            <circle data-art="litRelayDot" r={2.4} className="art-violet" />
                        </g>
                    ))}
                    <g data-art="packet">
                        <circle r={5.5} className="art-violet" opacity={0.22} />
                        <circle r={2.3} className="art-violet" />
                    </g>
                    <g data-art="cargoBlock" strokeLinejoin="round">
                        <circle r={9} className="art-keep" opacity={0.14} />
                        <path
                            d="M0 -5 L4.6 -2.5 V2.6 L0 5.1 L-4.6 2.6 V-2.5 Z"
                            className="art-keep-soft"
                            strokeWidth={1.15}
                        />
                        <path
                            d="M-4.6 -2.5 L0 0 L4.6 -2.5 M0 0 V5.1"
                            fill="none"
                            style={{ stroke: 'var(--art-keep)' }}
                            strokeWidth={1}
                        />
                    </g>
                    <g data-art="cargoTx">
                        <circle r={8} className="art-keep" opacity={0.14} />
                        <circle r={3} className="art-keep-soft" strokeWidth={1.3} />
                    </g>
                </g>
            </g>

            {/* 3. The screen. Everything local happens in here and is clipped to it, so nothing
            burning ever leaves it. */}
            <g transform={`translate(0 ${COMPUTER_OFFSET_Y})`}>
                <g clipPath={`url(#${ids.screen})`}>
                    <rect
                        data-art="queue"
                        x={QUEUE_X}
                        y={GRID.y}
                        width={CELL_PITCH + CELL_SIZE}
                        height={0}
                    />
                    <g data-art="gridGroup">
                        <rect
                            data-art="pending"
                            x={GRID.x}
                            y={GRID.y}
                            width={0}
                            height={GRID.height}
                        />
                        <rect
                            data-art="soloColumn"
                            x={0}
                            y={GRID.y}
                            width={CELL_SIZE}
                            height={GRID.height}
                            display="none"
                        />
                        {Array.from({ length: GRID.columns }, (_, index) => (
                            <g key={index} data-art="burn" display="none">
                                <rect
                                    data-art="burnEmber"
                                    y={GRID.y}
                                    width={CELL_SIZE}
                                    height={GRID.height}
                                />
                                <rect
                                    data-art="burnAsh"
                                    y={GRID.y}
                                    width={CELL_SIZE}
                                    height={GRID.height}
                                    opacity={0}
                                />
                            </g>
                        ))}
                        <rect
                            data-art="smoulder"
                            x={0}
                            y={GRID.y - 2.5}
                            width={14}
                            height={GRID.height + 5}
                            fill={`url(#${ids.smoulder})`}
                            opacity={0}
                        />
                        <line
                            data-art="checkLine"
                            className="art-check-line"
                            x1={0}
                            x2={0}
                            y1={GRID.y - 3.5}
                            y2={GRID.y + GRID.height + 3.5}
                            strokeWidth={1.1}
                            strokeLinecap="round"
                            opacity={0}
                        />
                        {Array.from({ length: MAX_MATCH_CELLS }, (_, index) => (
                            <g key={index} data-art="matchCell">
                                <rect
                                    data-art="matchSquare"
                                    width={CELL_SIZE}
                                    height={CELL_SIZE}
                                    rx={1.4}
                                    className="art-keep"
                                    display="none"
                                />
                                <circle
                                    data-art="matchDot"
                                    r={2.9}
                                    className="art-keep"
                                    display="none"
                                />
                            </g>
                        ))}
                    </g>
                    <line
                        x1={SEPARATOR.x1}
                        x2={SEPARATOR.x2}
                        y1={SEPARATOR.y}
                        y2={SEPARATOR.y}
                        className="art-separator"
                        strokeWidth={1}
                    />
                    {ADDRESS_PILLS.map(pill => (
                        <rect
                            key={pill.x}
                            x={pill.x}
                            y={TRAY.y - 1.75}
                            width={pill.width}
                            height={3.5}
                            rx={1.75}
                            className="art-pill"
                        />
                    ))}
                    {/* A match tints all address pills: the filter only says "one of yours". */}
                    {ADDRESS_PILLS.map(pill => (
                        <rect
                            key={pill.x}
                            data-art="pillHighlight"
                            x={pill.x}
                            y={TRAY.y - 1.75}
                            width={pill.width}
                            height={3.5}
                            rx={1.75}
                            className="art-keep"
                            opacity={0}
                        />
                    ))}
                    {Array.from({ length: TRAY.maxDots }, (_, index) => (
                        <circle
                            key={index}
                            data-art="keptDot"
                            cx={TRAY.firstDotX + index * TRAY.dotSpacing}
                            cy={TRAY.y}
                            r={2.3}
                            display="none"
                        />
                    ))}
                    <g data-art="box" display="none">
                        <rect
                            x={-BOX_SIZE.width / 2}
                            y={-BOX_SIZE.height / 2}
                            width={BOX_SIZE.width}
                            height={BOX_SIZE.height}
                            rx={BOX_SIZE.radius}
                            className="art-card-fill"
                        />
                        <rect
                            x={-BOX_SIZE.width / 2}
                            y={-BOX_SIZE.height / 2}
                            width={BOX_SIZE.width}
                            height={BOX_SIZE.height}
                            rx={BOX_SIZE.radius}
                            className="art-box"
                            strokeWidth={1.15}
                        />
                        <rect
                            data-art="boxGlow"
                            x={-BOX_SIZE.width / 2}
                            y={-BOX_SIZE.height / 2}
                            width={BOX_SIZE.width}
                            height={BOX_SIZE.height}
                            rx={BOX_SIZE.radius}
                            fill={`url(#${ids.boxGlow})`}
                            opacity={0}
                        />
                        <rect
                            data-art="boxHeader"
                            x={-16}
                            y={-24.5}
                            width={21}
                            height={3.6}
                            rx={1.8}
                            className="art-box-header"
                        />
                        {BLOCK_ROW_WIDTHS.map((width, index) => (
                            <rect
                                key={index}
                                data-art="blockRow"
                                x={-16}
                                y={getBlockRowY(index)}
                                width={width}
                                height={2.8}
                                rx={1.4}
                                className="art-cell"
                            />
                        ))}
                    </g>
                    <circle data-art="mover" r={2.3} display="none" />
                    {Array.from({ length: MAX_ASH_FLAKES }, (_, index) => (
                        <circle key={index} data-art="ashFlake" r={1} display="none" />
                    ))}
                </g>
            </g>

            {/* 4. The lit circuit's label, above everything. */}
            <text
                data-art="litLabel"
                className="art-violet-text"
                textAnchor="middle"
                opacity={0}
                aria-hidden="true"
            />
        </svg>
    );
};
