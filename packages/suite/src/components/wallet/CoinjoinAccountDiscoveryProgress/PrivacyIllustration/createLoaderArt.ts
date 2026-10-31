import { type FetchIdentityIndex } from '@trezor/coinjoin';

import {
    BLOCK_ROW_WIDTHS,
    CELL_PITCH,
    CELL_SIZE,
    GRID,
    LABEL_LINE_HEIGHT,
    LID,
    OPENED_BLOCK,
    PORT_LOCAL_Y,
    QUEUE_X,
    ROUTE_KEYS,
    TRAY,
    VIEW_WIDTH,
    clamp01,
    easeIn,
    easeInOut,
    easeOut,
    formatCoordinate,
    getBlockRowY,
    getCircuitKey,
    getColumnX,
    getPointOnRoute,
    getRowY,
    hashUnit,
    invertEaseInOut,
    lerp,
    progressBetween,
} from './illustrationGeometry';
import {
    type LabelBox,
    type LabelPlacement,
    placeCircuitLabel,
    placeStreamLabel,
    splitLabel,
} from './labelPlacement';
import {
    getScaleTransform,
    getTranslate,
    measureRoutes,
    queryAll,
    queryNodes,
    queryPool,
    setAttribute,
    setVisible,
} from './loaderArtNodes';
import {
    COOLDOWN,
    type FetchKind,
    type FetchTimes,
    MOTION,
    getFetchTimes,
} from './loaderArtTiming';

export type DiscoveryStage = 'block' | 'mempool';

export type IllustrationBeat = 'fetchBlocks' | 'fetchTransactions' | 'keep' | 'chance';

export type IllustrationLabels = {
    blockStream: string;
    mempoolStream: string;
    genericCircuit: string;
    circuits: Record<FetchIdentityIndex, string>;
};

export type IllustrationPatternIds = Record<
    'square' | 'round' | 'squareEmber' | 'roundEmber' | 'squareAsh' | 'roundAsh',
    string
>;

type CreateLoaderArtParams = {
    staticLayer: SVGSVGElement;
    dynamicLayer: SVGSVGElement;
    patternIds: IllustrationPatternIds;
    onBeat: (time: number, beat: IllustrationBeat) => void;
};

export type LoaderArt = NonNullable<ReturnType<typeof createLoaderArt>>;

type MatchCell = { square: SVGElement; dot: SVGElement };

type Presentation = {
    handle: number;
    kind: FetchKind;
    isFull: boolean;
    identity: FetchIdentityIndex;
    startedAt: number;
    doneAt: number | null;
    isRelevant: boolean;
    cancelledAt: number | null;
    column: number;
    isSolo: boolean;
    isSoloBurnt: boolean;
    row: number;
    ownRow: number;
    cell: MatchCell;
    keptIndex: number;
    hasBlink: boolean;
    beats: Set<string>;
    hasEnded: boolean;
    holdsCell: boolean;
    label: string | null;
};

type Batch = {
    stage: DiscoveryStage;
    startedAt: number;
    sweep: number;
    burntColumns: number;
    seed: number;
    sweepDuration: number;
    doneAt: number | null;
};

type KeptDot = { isRing: boolean; landsAt: number | null };

type BurnSlot = {
    group: SVGElement;
    ember: SVGElement;
    ash: SVGElement;
    column: number;
    startedAt: number;
    still: { scale: number; ember: number; ash: number } | null;
};

type AshFlake = {
    node: SVGElement;
    isLive: boolean;
    startedAt: number;
    x: number;
    y: number;
    life: number;
    drift: number;
    fall: number;
    radius: number;
};

type StreamMode = 'block' | 'mempool' | 'trickle' | 'idle';

type ArtState = {
    stage: DiscoveryStage;
    hasStage: boolean;
    isDownloading: boolean;
    streamAlpha: number;
    streamOffset: number;
    queueFill: number;
    pourStartedAt: number | null;
    batch: Batch | null;
    // Real batches that arrived while the visual sweep was still busy with an earlier one.
    hasPendingBatch: boolean;
    sweepTarget: number;
    hasSweepTarget: boolean;
    presentations: Presentation[];
    // The fetch whose done hasn't arrived: the check line waits for it.
    open: Presentation | null;
    full: Presentation | null;
    lastFullStartAt: number;
    lastFullEndAt: number;
    compactsSinceFull: number;
    lastBlinkAt: number;
    kept: KeptDot[];
    pillsAt: number;
    cellCursor: number;
};

const STILL_CIRCUIT: FetchIdentityIndex = 1;

const EMPTY_LABELS: IllustrationLabels = {
    blockStream: '',
    mempoolStream: '',
    genericCircuit: '',
    circuits: { 0: '', 1: '', 2: '', 3: '' },
};

/**
 * The illustration's renderer. Real scan events come in paired by handle (fetchStart returns it,
 * fetchDone and fetchCancel close it); how they are presented is decided separately, so at most one
 * circuit is fully lit at a time and a late done can never touch another presentation. Drawing only
 * writes SVG attributes, nothing goes through React state.
 */
export const createLoaderArt = ({
    staticLayer,
    dynamicLayer,
    patternIds,
    onBeat,
}: CreateLoaderArtParams) => {
    const measured = measureRoutes(staticLayer, dynamicLayer);
    const nodes = queryNodes(dynamicLayer);
    const streamLabel = dynamicLayer.querySelector<SVGTextElement>('text[data-art="streamLabel"]');
    const litLabel = dynamicLayer.querySelector<SVGTextElement>('text[data-art="litLabel"]');
    const matchCells: MatchCell[] = queryPool(dynamicLayer, 'matchCell', [
        'matchSquare',
        'matchDot',
    ] as const).map(cell => ({ square: cell.matchSquare, dot: cell.matchDot }));
    const [firstMatchCell] = matchCells;

    if (!measured || !nodes || !streamLabel || !litLabel || !firstMatchCell) return null;

    const { routes, bases } = measured;
    const litRelays = queryPool(dynamicLayer, 'litRelay', [
        'litRelayPulse',
        'litRelayDot',
    ] as const);
    const burnSlots: BurnSlot[] = queryPool(dynamicLayer, 'burn', [
        'burnEmber',
        'burnAsh',
    ] as const).map(slot => ({
        group: slot.group,
        ember: slot.burnEmber,
        ash: slot.burnAsh,
        column: -1,
        startedAt: 0,
        still: null,
    }));
    const flakes: AshFlake[] = queryAll(dynamicLayer, 'ashFlake').map(node => ({
        node,
        isLive: false,
        startedAt: 0,
        x: 0,
        y: 0,
        life: 1,
        drift: 0,
        fall: 0,
        radius: 1,
    }));
    const blockRows = queryAll(dynamicLayer, 'blockRow');
    const keptDots = queryAll(dynamicLayer, 'keptDot');
    const pillHighlights = queryAll(dynamicLayer, 'pillHighlight');

    const view = { x0: 0, x1: VIEW_WIDTH };
    let labels = EMPTY_LABELS;
    let isStill = false;
    let handleSequence = 0;
    let streamBox: LabelBox | null = null;
    const circuitPlacements = new Map<string, LabelPlacement | null>();

    const createState = (): ArtState => ({
        stage: 'block',
        hasStage: false,
        isDownloading: false,
        streamAlpha: MOTION.stream.idle.alpha,
        streamOffset: 0,
        queueFill: 0,
        pourStartedAt: null,
        batch: null,
        hasPendingBatch: false,
        sweepTarget: 0,
        hasSweepTarget: false,
        presentations: [],
        open: null,
        full: null,
        lastFullStartAt: -Infinity,
        lastFullEndAt: -Infinity,
        compactsSinceFull: 0,
        lastBlinkAt: -Infinity,
        kept: [],
        pillsAt: -Infinity,
        cellCursor: 0,
    });
    let state = createState();

    // Drops everything in flight but keeps what is true: the stage and what discovery found so far.
    const resetPresentation = () => {
        const { stage, hasStage, kept } = state;
        state = createState();
        state.stage = stage;
        state.hasStage = hasStage;
        state.kept = kept.map(dot => ({ isRing: dot.isRing, landsAt: -1 }));
        burnSlots.forEach(slot => {
            slot.column = -1;
            slot.still = null;
            setVisible(slot.group, false);
        });
        flakes.forEach(flake => {
            flake.isLive = false;
            setVisible(flake.node, false);
        });
        matchCells.forEach(cell => {
            setVisible(cell.square, false);
            setVisible(cell.dot, false);
        });
        ROUTE_KEYS.forEach(key => setAttribute(bases[key], 'opacity', 1));
    };

    const getPatternFill = (variant: '' | 'Ember' | 'Ash') => {
        const shape = state.stage === 'mempool' ? 'round' : 'square';
        const key = `${shape}${variant}` as const;

        return `url(#${patternIds[key]})`;
    };
    const getCheckLineX = (sweep: number) => GRID.x - 3 + sweep * (GRID.width + 6);
    const getEdgeFade = (x: number) => {
        const visibleWidth = view.x1 - view.x0;

        return (
            progressBetween(x, view.x0 + 6, view.x0 + 0.12 * visibleWidth) *
            progressBetween(x, view.x1 - 6, view.x1 - 0.12 * visibleWidth)
        );
    };
    const getStreamMode = (): StreamMode => {
        if (state.isDownloading) return state.stage;

        return state.stage === 'mempool' ? 'trickle' : 'idle';
    };

    const spawnFlake = (time: number, x: number, y: number, seed: number) => {
        const flake = flakes.find(candidate => !candidate.isLive);

        if (!flake) return;

        Object.assign(flake, {
            isLive: true,
            startedAt: time,
            x,
            y,
            life: 0.9 + hashUnit(seed, 3) * 0.5,
            drift: (hashUnit(seed, 4) - 0.5) * 4,
            fall: 7 + hashUnit(seed, 5) * 7,
            radius: 0.7 + hashUnit(seed, 6) * 0.45,
        });
    };

    const burnColumn = (column: number, time: number, seed: number) => {
        const slot =
            burnSlots.find(candidate => candidate.column < 0) ??
            burnSlots.reduce<BurnSlot | null>(
                (oldest, candidate) =>
                    !oldest || candidate.startedAt < oldest.startedAt ? candidate : oldest,
                null,
            );

        if (!slot) return;

        Object.assign(slot, { column, startedAt: time, still: null });
        setAttribute(slot.ember, 'fill', getPatternFill('Ember'));
        setAttribute(slot.ash, 'fill', getPatternFill('Ash'));
        setAttribute(slot.ember, 'x', getColumnX(column));
        setAttribute(slot.ash, 'x', getColumnX(column));

        // Sampled per column of 50 filters, not one flake per filter.
        const flakeCount = hashUnit(seed, column) < 0.6 ? 2 : 1;
        for (let index = 0; index < flakeCount; index++) {
            spawnFlake(
                time + 0.1,
                getColumnX(column) + CELL_SIZE / 2 + (hashUnit(seed, column, index) - 0.5) * 4,
                getRowY(Math.floor(hashUnit(seed, column, index + 7) * GRID.rows)) + 3,
                seed * 31 + column * 7 + index,
            );
        }
    };

    const getTimes = (presentation: Presentation): FetchTimes => {
        if (presentation.cancelledAt !== null) {
            const cancel = presentation.cancelledAt - presentation.startedAt;

            return {
                outEnd: Infinity,
                returnAt: Infinity,
                backAt: Infinity,
                dockedAt: Infinity,
                stripAt: Infinity,
                end: cancel + MOTION.fetch.cancel,
                cancel,
            };
        }

        const doneAfter =
            presentation.doneAt === null ? null : presentation.doneAt - presentation.startedAt;

        return getFetchTimes(presentation.kind, presentation.isRelevant, doneAfter);
    };

    const getCellEnd = (presentation: Presentation) =>
        presentation.doneAt === null || presentation.holdsCell
            ? Infinity
            : presentation.doneAt -
              presentation.startedAt +
              MOTION.fetch.cellHold +
              MOTION.fetch.cellFade;

    const isCellOn = (presentation: Presentation, time: number) => {
        const elapsed = time - presentation.startedAt;

        return elapsed >= 0 && elapsed < getCellEnd(presentation);
    };

    // The fully lit circuit stays visible from its start until it has faded after the cargo got home.
    const getLitVisibility = (presentation: Presentation | null, time: number) => {
        if (!presentation) return 0;

        const times = getTimes(presentation);
        const elapsed = time - presentation.startedAt;

        if (times.cancel !== null) {
            return 1 - progressBetween(elapsed, times.cancel, times.cancel + MOTION.fetch.cancel);
        }

        return 1 - progressBetween(elapsed, times.backAt, times.backAt + MOTION.fetch.litFade);
    };

    const measureText = (label: SVGTextElement, text: string) => {
        label.textContent = text;

        return label.getComputedTextLength() || text.length * 6.4;
    };

    const writeLabel = (label: SVGTextElement, placement: LabelPlacement) => {
        label.textContent = '';
        placement.lines.forEach((line, index) => {
            const span = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            span.setAttribute('x', formatCoordinate(placement.centerX));
            span.setAttribute('dy', String(index ? LABEL_LINE_HEIGHT : 0));
            span.textContent = line;
            label.appendChild(span);
        });
        label.setAttribute('x', formatCoordinate(placement.centerX));
        label.setAttribute('y', formatCoordinate(placement.baselineY));
    };

    const updateStreamLabel = () => {
        const text = state.stage === 'mempool' ? labels.mempoolStream : labels.blockStream;
        const twoLines = splitLabel(text);
        const variants = [[text], ...(twoLines ? [twoLines] : [])].map(lines => ({
            lines,
            width: Math.max(...lines.map(line => measureText(streamLabel, line))),
        }));
        const placement = placeStreamLabel({ routes, variants, viewLeft: view.x0 });
        streamBox = placement?.box ?? null;
        // Circuit labels keep clear of the stream label, so they are placed again whenever it moves.
        circuitPlacements.clear();

        if (placement) {
            writeLabel(streamLabel, placement);
        } else {
            streamLabel.textContent = '';
        }
    };

    // Measuring forces a layout and the search is costly, so each circuit is placed once per
    // layout, not on every light-up.
    const getCircuitPlacement = (identity: FetchIdentityIndex, text: string) => {
        const circuit = getCircuitKey(identity);
        const cacheKey = `${circuit}\n${text}`;
        const cached = circuitPlacements.get(cacheKey);

        if (cached !== undefined) return cached;

        const placement = placeCircuitLabel({
            routes,
            circuit,
            text,
            width: measureText(litLabel, text),
            streamBox,
            viewLeft: view.x0,
        });
        circuitPlacements.set(cacheKey, placement);

        return placement;
    };

    const updateCircuitLabel = (presentation: Presentation | null) => {
        if (!presentation) return;

        const placement = getCircuitPlacement(
            presentation.identity,
            presentation.label ?? labels.circuits[presentation.identity],
        );

        // Without room beside its own circuit the label is left out, never shown elsewhere.
        if (placement) {
            writeLabel(litLabel, placement);
        } else {
            litLabel.textContent = '';
        }
    };

    const showFullCircuit = (presentation: Presentation) => {
        const key = getCircuitKey(presentation.identity);
        const { path, length } = routes[key];
        setAttribute(bases[key], 'opacity', 0);
        (['litGlow', 'litCore', 'litHead', 'trail'] as const).forEach(name =>
            setAttribute(nodes[name], 'd', path),
        );
        setAttribute(
            nodes.litGlow,
            'stroke-dasharray',
            `${formatCoordinate(length)} ${formatCoordinate(length)}`,
        );
        setAttribute(
            nodes.litCore,
            'stroke-dasharray',
            `${formatCoordinate(length)} ${formatCoordinate(length)}`,
        );
        setAttribute(nodes.litHead, 'stroke-dasharray', `28 ${formatCoordinate(length + 40)}`);
        setAttribute(nodes.trail, 'stroke-dasharray', `58 ${formatCoordinate(length + 70)}`);
        updateCircuitLabel(presentation);
    };

    const startBatch = (time: number) => {
        const previous = state.batch;

        if (previous) {
            for (let column = previous.burntColumns; column < GRID.columns; column++) {
                burnColumn(column, time, previous.seed);
            }
        }

        state.batch = {
            stage: state.stage,
            startedAt: time,
            sweep: 0,
            burntColumns: 0,
            seed: Math.floor(time * 1000) + 17,
            sweepDuration: MOTION.sweep[state.stage],
            doneAt: null,
        };
        state.pourStartedAt = time;
        state.hasPendingBatch = false;
        state.sweepTarget = 0;
        state.hasSweepTarget = false;
    };

    const startPresentation = (
        time: number,
        identity: FetchIdentityIndex,
        label: string | null = null,
    ) => {
        const handle = ++handleSequence;
        const { batch } = state;
        const requiredGap = state.compactsSinceFull >= 2 ? COOLDOWN.busyGap : COOLDOWN.minGap;
        const isFull =
            !state.full &&
            time - state.lastFullStartAt >= requiredGap &&
            time - state.lastFullEndAt >= COOLDOWN.rest;
        const hasBlink =
            !isFull &&
            time - state.lastBlinkAt >= COOLDOWN.blinkGap &&
            getLitVisibility(state.full, time) <= 0;
        const presentation: Presentation = {
            handle,
            kind: state.stage === 'mempool' ? 'tx' : 'block',
            isFull,
            identity,
            startedAt: time,
            doneAt: null,
            isRelevant: false,
            cancelledAt: null,
            // The filter under the waiting check line matched. If the visual sweep already finished
            // this batch, that one column is shown again instead of a lone cell on an empty grid.
            column: batch ? Math.min(batch.burntColumns, GRID.columns - 1) : 0,
            isSolo: !!batch && batch.burntColumns >= GRID.columns,
            isSoloBurnt: false,
            row: Math.floor(hashUnit(handle, 1) * GRID.rows),
            ownRow: 2 + Math.floor(hashUnit(handle, 2) * 5),
            cell: matchCells[state.cellCursor++ % matchCells.length] ?? firstMatchCell,
            keptIndex: -1,
            hasBlink,
            beats: new Set(),
            hasEnded: false,
            holdsCell: false,
            label,
        };
        state.presentations.push(presentation);
        state.open = presentation;
        state.pillsAt = time;

        if (isFull) {
            state.full = presentation;
            state.lastFullStartAt = time;
            state.compactsSinceFull = 0;
            showFullCircuit(presentation);
        } else {
            state.compactsSinceFull++;
        }

        if (hasBlink) state.lastBlinkAt = time;

        return presentation;
    };

    const findPresentation = (handle: number) =>
        state.presentations.find(presentation => presentation.handle === handle);

    const fetchCancel = (time: number, handle: number) => {
        const presentation = findPresentation(handle);

        if (!presentation) return;
        if (presentation.cancelledAt !== null) return;

        if (presentation.doneAt === null) {
            presentation.doneAt = time;
            presentation.isRelevant = false;
        }

        presentation.cancelledAt = Math.max(time, presentation.startedAt);

        if (state.open === presentation) state.open = null;
    };

    // Captions and the kept tray follow the presentation, not the raw events.
    const emitFullBeats = (presentation: Presentation, time: number) => {
        const times = getTimes(presentation);
        const elapsed = time - presentation.startedAt;
        const beat = (key: string, at: number, run: () => void) => {
            if (presentation.beats.has(key) || elapsed < at) return;

            presentation.beats.add(key);
            run();
        };
        const land = () => {
            const dot = state.kept[presentation.keptIndex];
            if (dot) dot.landsAt = time;
        };

        if (presentation.cancelledAt === null) {
            beat('fetch', 0.1, () =>
                onBeat(time, presentation.kind === 'tx' ? 'fetchTransactions' : 'fetchBlocks'),
            );
        }

        if (
            presentation.cancelledAt === null &&
            presentation.doneAt !== null &&
            presentation.kind === 'block'
        ) {
            if (presentation.isRelevant) {
                beat('keep', times.dockedAt + MOTION.fetch.lift, () => onBeat(time, 'keep'));
                beat('kept', times.dockedAt + MOTION.fetch.liftEnd, land);
            } else {
                beat('chance', times.stripAt, () => onBeat(time, 'chance'));
            }

            let burnOrder = 0;
            BLOCK_ROW_WIDTHS.forEach((width, row) => {
                if (presentation.isRelevant && row === presentation.ownRow) return;

                const at = times.stripAt + burnOrder * MOTION.fetch.rowGap + MOTION.fetch.rowTint;
                burnOrder++;
                beat(`row${row}`, at, () => {
                    for (let index = 0; index < 2; index++) {
                        spawnFlake(
                            time,
                            OPENED_BLOCK.centerX - 16 + hashUnit(row, index, 9) * width,
                            OPENED_BLOCK.centerY + getBlockRowY(row) + 1.4,
                            row * 13 + index + presentation.handle,
                        );
                    }
                });
            });
        }

        if (
            presentation.cancelledAt === null &&
            presentation.doneAt !== null &&
            presentation.kind === 'tx'
        ) {
            if (presentation.isRelevant) {
                beat('kept', times.end - 0.02, land);
            } else {
                beat('chance', times.backAt, () => onBeat(time, 'chance'));
            }
        }

        if (elapsed >= times.end && elapsed >= getCellEnd(presentation))
            presentation.hasEnded = true;
    };

    const drawStream = () => {
        const mode = getStreamMode();
        setAttribute(nodes.streamDots, 'stroke-dasharray', MOTION.stream[mode].dash);
        setAttribute(
            nodes.streamDots,
            'stroke-dashoffset',
            formatCoordinate(state.streamOffset % 400),
        );
        setAttribute(nodes.streamDots, 'stroke-opacity', state.streamAlpha);
    };

    const drawQueueAndSweep = (time: number) => {
        const { batch, pourStartedAt } = state;
        // The queue fills bottom-up, a row at a time, and pours into the grid when its batch begins.
        const queueRows =
            pourStartedAt === null ? Math.floor(state.queueFill * GRID.rows + 1e-6) : GRID.rows;
        let queueOpacity =
            pourStartedAt === null
                ? 1
                : 1 - progressBetween(time, pourStartedAt, pourStartedAt + MOTION.pour * 0.8);

        // After the last, up-to-date answer nothing more is downloading, so the empty queue goes.
        const batchDoneAt = batch?.doneAt ?? null;

        if (batchDoneAt !== null && !state.isDownloading && pourStartedAt === null) {
            queueOpacity *= 1 - progressBetween(time, batchDoneAt + 0.6, batchDoneAt + 1.0);
        }

        setAttribute(nodes.queue, 'fill', getPatternFill(''));
        setAttribute(nodes.queue, 'x', QUEUE_X);
        setAttribute(nodes.queue, 'y', GRID.y + (GRID.rows - queueRows) * CELL_PITCH);
        setAttribute(
            nodes.queue,
            'height',
            queueRows ? queueRows * CELL_PITCH - (CELL_PITCH - CELL_SIZE) : 0,
        );
        setAttribute(nodes.queue, 'opacity', queueOpacity);
        setAttribute(nodes.pending, 'fill', getPatternFill(''));

        if (!batch) {
            setAttribute(nodes.pending, 'width', 0);
            setAttribute(nodes.checkLine, 'opacity', 0);
            setAttribute(nodes.smoulder, 'opacity', 0);

            return;
        }

        const arrivedColumns = Math.ceil(
            easeOut(progressBetween(time, batch.startedAt, batch.startedAt + MOTION.pour)) *
                GRID.columns -
                1e-6,
        );
        const left = getColumnX(batch.burntColumns);
        const right = arrivedColumns > 0 ? getColumnX(arrivedColumns - 1) + CELL_SIZE : left;
        setAttribute(nodes.pending, 'x', left);
        setAttribute(nodes.pending, 'width', Math.max(0, right - left));

        const hasStarted = time >= batch.startedAt + MOTION.pour;
        const lineX = getCheckLineX(batch.sweep);
        const fadeOut =
            batch.doneAt === null ? 1 : 1 - progressBetween(time, batch.doneAt, batch.doneAt + 0.3);
        const waiting = state.open ? 0.55 : 1;
        setAttribute(nodes.checkLine, 'x1', lineX);
        setAttribute(nodes.checkLine, 'x2', lineX);
        setAttribute(nodes.checkLine, 'opacity', hasStarted ? 0.75 * fadeOut * waiting : 0);
        setAttribute(
            nodes.checkLine,
            'stroke-dasharray',
            state.stage === 'mempool' ? '1.4 2.3' : 'none',
        );
        setAttribute(nodes.smoulder, 'x', lineX - 14);
        setAttribute(nodes.smoulder, 'opacity', hasStarted ? fadeOut * waiting : 0);
    };

    const drawBurns = (time: number) => {
        // Discarded columns: a brief warm tint, then they crumble to ash and vanish.
        const { tint, crumble } = MOTION.burn;
        burnSlots.forEach(slot => {
            setVisible(slot.group, slot.column >= 0);

            if (slot.column < 0) return;

            const centerX = getColumnX(slot.column) + CELL_SIZE / 2;

            if (slot.still) {
                const { scale } = slot.still;
                setAttribute(
                    slot.group,
                    'transform',
                    getScaleTransform(scale, scale, centerX, GRID.centerY),
                );
                setAttribute(slot.ember, 'opacity', slot.still.ember);
                setAttribute(slot.ash, 'opacity', slot.still.ash);

                return;
            }

            const age = time - slot.startedAt;
            const crumbled = progressBetween(age, tint, tint + crumble);
            const scale = 1 - 0.5 * easeIn(crumbled);
            const emberOpacity =
                0.85 *
                progressBetween(age, 0, 0.06) *
                (1 - progressBetween(age, tint * 0.6, tint + 0.12));
            setAttribute(
                slot.group,
                'transform',
                getScaleTransform(scale, scale, centerX, GRID.centerY),
            );
            setAttribute(slot.ember, 'opacity', emberOpacity);
            setAttribute(
                slot.ash,
                'opacity',
                progressBetween(age, tint * 0.5, tint + 0.05) * (1 - crumbled),
            );
        });

        // Ash flakes: warm for a moment, then grey, settling downwards inside the screen.
        flakes.forEach(flake => {
            const isShown = flake.isLive && time >= flake.startedAt;
            setVisible(flake.node, isShown);

            if (!isShown) return;

            const age = clamp01((time - flake.startedAt) / flake.life);
            setAttribute(flake.node, 'cx', flake.x + flake.drift * age);
            setAttribute(flake.node, 'cy', flake.y + flake.fall * (0.35 * age + 0.65 * age * age));
            setAttribute(flake.node, 'r', flake.radius * (1 - 0.35 * age));
            setAttribute(
                flake.node,
                'opacity',
                Math.min(1, age * 12) * Math.pow(1 - age, 0.8) * 0.95,
            );
            setAttribute(flake.node, 'class', age < 0.22 ? 'art-spark' : 'art-ash');
        });
    };

    const drawMatches = (time: number) => {
        // One cell per fetch, full or compact.
        state.presentations.forEach(presentation => {
            const elapsed = time - presentation.startedAt;
            const isOn = isCellOn(presentation, time);
            const isTx = presentation.kind === 'tx';
            setVisible(presentation.cell.square, isOn && !isTx);
            setVisible(presentation.cell.dot, isOn && isTx);

            if (!isOn) return;

            const end = getCellEnd(presentation);
            const pop = 1 + 0.25 * Math.sin(Math.PI * progressBetween(elapsed, 0, 0.3));
            const x = getColumnX(presentation.column);
            const y = getRowY(presentation.row);
            const cellNode = isTx ? presentation.cell.dot : presentation.cell.square;

            if (isTx) {
                setAttribute(cellNode, 'cx', x + CELL_SIZE / 2);
                setAttribute(cellNode, 'cy', y + CELL_SIZE / 2);
                setAttribute(cellNode, 'r', 2.9 * pop);
            } else {
                setAttribute(cellNode, 'x', x);
                setAttribute(cellNode, 'y', y);
                setAttribute(
                    cellNode,
                    'transform',
                    getScaleTransform(pop, pop, x + CELL_SIZE / 2, y + CELL_SIZE / 2),
                );
            }

            const fade = 1 - progressBetween(elapsed, end - MOTION.fetch.cellFade, end);
            setAttribute(cellNode, 'opacity', progressBetween(elapsed, 0, 0.12) * fade);
        });

        // The re-shown column of a batch that was already done.
        const solo = state.presentations.findLast(
            presentation =>
                presentation.isSolo && !presentation.isSoloBurnt && isCellOn(presentation, time),
        );
        setVisible(nodes.soloColumn, !!solo);

        if (solo) {
            setAttribute(nodes.soloColumn, 'x', getColumnX(solo.column));
            setAttribute(nodes.soloColumn, 'fill', getPatternFill(''));
        }

        // A match tints all address pills: the filter only says "one of yours".
        const pillAlpha =
            progressBetween(time, state.pillsAt, state.pillsAt + 0.2) *
            (1 - progressBetween(time, state.pillsAt + 1.1, state.pillsAt + 1.8));
        pillHighlights.forEach(pill => setAttribute(pill, 'opacity', pillAlpha * 0.75));
    };

    const drawTray = (time: number) => {
        const getLandedAt = (dot: KeptDot) =>
            dot.landsAt !== null && time >= dot.landsAt ? dot.landsAt : null;

        // Filled = confirmed, ring = unconfirmed. Each dot pops in when it lands; past the last slot,
        // that slot pulses for every further keep instead of growing.
        keptDots.forEach((dotNode, index) => {
            const isLastSlot = index === TRAY.maxDots - 1;
            const candidates = isLastSlot
                ? state.kept.slice(index)
                : state.kept.slice(index, index + 1);
            const dot = candidates.reduce<KeptDot | null>((latest, candidate) => {
                const landedAt = getLandedAt(candidate);

                return landedAt !== null && (!latest || landedAt >= (latest.landsAt ?? -Infinity))
                    ? candidate
                    : latest;
            }, null);
            const landedAt = dot ? getLandedAt(dot) : null;
            setVisible(dotNode, landedAt !== null);

            if (!dot || landedAt === null) return;

            const pulse = progressBetween(time, landedAt, landedAt + MOTION.pulse);
            const pop = 1 + 0.45 * Math.sin(Math.PI * pulse);
            setAttribute(dotNode, 'class', dot.isRing ? 'art-keep-ring' : 'art-keep');
            setAttribute(dotNode, 'r', (dot.isRing ? 2.1 : 2.3) * pop);
        });
    };

    const drawLitCircuit = (presentation: Presentation, time: number) => {
        const timing = MOTION.fetch;
        const times = getTimes(presentation);
        const elapsed = time - presentation.startedAt;
        const route = routes[getCircuitKey(presentation.identity)];
        const litVisibility = getLitVisibility(presentation, time);
        setVisible(nodes.lit, litVisibility > 0);
        setAttribute(nodes.lit, 'opacity', litVisibility);

        // The request goes out: the circuit lights up from this computer outwards, relay by relay.
        const outEnd = timing.outAt + timing.out[presentation.kind];
        const outFraction = easeInOut(
            progressBetween(elapsed, timing.outAt, Math.min(times.outEnd, outEnd)),
        );
        const front = outFraction * route.length;
        const isWaiting = presentation.doneAt === null && elapsed > outEnd + timing.minDwell;
        setAttribute(nodes.litCore, 'stroke-dashoffset', route.length - front);
        setAttribute(nodes.litGlow, 'stroke-dashoffset', route.length - front);
        setAttribute(
            nodes.litGlow,
            'opacity',
            isWaiting ? 0.75 + 0.25 * Math.cos((elapsed - outEnd) * 3) : 1,
        );
        setAttribute(nodes.litHead, 'stroke-dashoffset', -(front - 28));
        setAttribute(
            nodes.litHead,
            'opacity',
            outFraction > 0 ? 1 - progressBetween(elapsed, outEnd, outEnd + 0.3) : 0,
        );

        const isPacketOn = outFraction > 0 && elapsed < outEnd + 0.1;
        setVisible(nodes.packet, isPacketOn);

        if (isPacketOn) {
            const [x, y] = getPointOnRoute(route, front);
            setAttribute(nodes.packet, 'transform', getTranslate(x, y));
            setAttribute(
                nodes.packet,
                'opacity',
                getEdgeFade(x) * (1 - progressBetween(elapsed, outEnd - 0.1, outEnd + 0.1)),
            );
        }

        route.hopDistances.forEach((distance, index) => {
            const relay = litRelays[index];
            const hop = route.hops[index];

            if (!relay || !hop) return;

            const passedAt =
                timing.outAt +
                timing.out[presentation.kind] * invertEaseInOut(clamp01(distance / route.length));
            const pulse = progressBetween(elapsed, passedAt, passedAt + 0.6);
            const isPulsing = pulse > 0 && pulse < 1;
            setAttribute(relay.group, 'transform', getTranslate(hop.x, hop.y));
            setAttribute(
                relay.litRelayDot,
                'opacity',
                progressBetween(elapsed, passedAt, passedAt + 0.08) * getEdgeFade(hop.x),
            );
            setAttribute(relay.litRelayPulse, 'r', 2.4 + 6 * easeOut(pulse));
            setAttribute(
                relay.litRelayPulse,
                'opacity',
                isPulsing ? 0.5 * (1 - pulse) * getEdgeFade(hop.x) : 0,
            );
        });
        setAttribute(litLabel, 'opacity', progressBetween(elapsed, 0.5, 0.8) * litVisibility);
        // One prominent label at a time: the stream label steps back while a circuit is lit.
        setAttribute(
            streamLabel,
            'opacity',
            1 - 0.65 * litVisibility * progressBetween(elapsed, 0.3, 0.6),
        );

        // The one block (or transaction) comes back along the same circuit.
        const isTx = presentation.kind === 'tx';
        const cargo = isTx ? nodes.cargoTx : nodes.cargoBlock;
        const isComingBack = elapsed >= times.returnAt && elapsed < times.backAt;
        setVisible(isTx ? nodes.cargoBlock : nodes.cargoTx, false);
        setVisible(cargo, isComingBack);

        if (isComingBack) {
            const distance =
                route.length *
                (1 - easeInOut(progressBetween(elapsed, times.returnAt, times.backAt)));
            const [x, y] = getPointOnRoute(route, distance);
            setAttribute(cargo, 'transform', getTranslate(x, y));
            setAttribute(cargo, 'opacity', getEdgeFade(x));
            setAttribute(nodes.trail, 'stroke-dashoffset', formatCoordinate(-distance));
        }

        const trailFade =
            elapsed >= times.backAt
                ? 1 - progressBetween(elapsed, times.backAt, times.backAt + 0.25)
                : 0;
        setAttribute(nodes.trail, 'opacity', 0.85 * (isComingBack ? 1 : trailFade));
    };

    const drawArrivedTransaction = (presentation: Presentation, time: number) => {
        const times = getTimes(presentation);
        const elapsed = time - presentation.startedAt;
        const isMoving = elapsed >= times.backAt && elapsed < times.end;
        setVisible(nodes.box, false);
        setVisible(nodes.mover, isMoving);

        if (!isMoving) return;

        const portX = LID.left + 6;

        if (presentation.isRelevant) {
            // An unconfirmed transaction of yours lands in the tray as a ring.
            const fraction = easeInOut(progressBetween(elapsed, times.backAt, times.end));
            const targetX =
                TRAY.firstDotX +
                Math.min(presentation.keptIndex, TRAY.maxDots - 1) * TRAY.dotSpacing;
            setAttribute(nodes.mover, 'cx', lerp(portX, targetX, fraction));
            setAttribute(
                nodes.mover,
                'cy',
                lerp(PORT_LOCAL_Y, TRAY.y, fraction) - 10 * Math.sin(Math.PI * fraction),
            );
            setAttribute(nodes.mover, 'r', lerp(3, 2.1, fraction));
            setAttribute(nodes.mover, 'class', 'art-keep-ring');
            setAttribute(nodes.mover, 'opacity', 1);

            return;
        }

        // A chance match isn't yours, so nothing lands: it greys out at the port. It doesn't burn,
        // the mempool controller keeps it in memory like every other mempool transaction.
        const fraction = progressBetween(elapsed, times.backAt, times.end);
        setAttribute(nodes.mover, 'cx', portX + 7 * easeOut(fraction));
        setAttribute(nodes.mover, 'cy', PORT_LOCAL_Y);
        setAttribute(nodes.mover, 'r', 3 - 0.6 * fraction);
        setAttribute(nodes.mover, 'class', 'art-ash-ring');
        setAttribute(nodes.mover, 'opacity', 1 - easeIn(fraction));
    };

    // Returns how much the grid behind the opened block is dimmed.
    const drawArrivedBlock = (presentation: Presentation, time: number) => {
        const timing = MOTION.fetch;
        const times = getTimes(presentation);
        const elapsed = time - presentation.startedAt;
        const isBoxOn = elapsed >= times.backAt && elapsed < times.end;
        // Your transaction leaves the block first, then the rest burns.
        const isMoving =
            presentation.isRelevant &&
            elapsed >= times.dockedAt + timing.lift &&
            elapsed < times.dockedAt + timing.liftEnd;
        setVisible(nodes.box, isBoxOn);
        setVisible(nodes.mover, isMoving);

        if (isMoving) {
            const fraction = easeInOut(
                progressBetween(
                    elapsed,
                    times.dockedAt + timing.lift,
                    times.dockedAt + timing.liftEnd,
                ),
            );
            const width = BLOCK_ROW_WIDTHS[presentation.ownRow] ?? 0;
            const fromX = OPENED_BLOCK.centerX - 16 + width / 2;
            const fromY = OPENED_BLOCK.centerY + getBlockRowY(presentation.ownRow) + 1.4 - 1.6;
            const toX =
                TRAY.firstDotX +
                Math.min(presentation.keptIndex, TRAY.maxDots - 1) * TRAY.dotSpacing;
            setAttribute(nodes.mover, 'cx', lerp(fromX, toX, fraction));
            setAttribute(
                nodes.mover,
                'cy',
                lerp(fromY, TRAY.y, fraction) - 7 * Math.sin(Math.PI * fraction),
            );
            setAttribute(nodes.mover, 'r', lerp(1.6, 2.3, fraction));
            setAttribute(nodes.mover, 'class', 'art-keep');
            setAttribute(nodes.mover, 'opacity', 1);
        }

        if (!isBoxOn) return 0;

        const docking = easeInOut(progressBetween(elapsed, times.backAt, times.dockedAt));
        const boxX = lerp(LID.left + 6, OPENED_BLOCK.centerX, docking);
        const boxY = lerp(PORT_LOCAL_Y, OPENED_BLOCK.centerY, docking);
        const rowsIn = progressBetween(elapsed, times.dockedAt - 0.1, times.dockedAt + 0.15);
        setAttribute(
            nodes.box,
            'transform',
            `${getTranslate(boxX, boxY)} scale(${lerp(0.14, 1, docking).toFixed(3)})`,
        );
        setAttribute(
            nodes.box,
            'opacity',
            1 - progressBetween(elapsed, times.stripAt + timing.closeAfter, times.end),
        );
        setAttribute(nodes.boxHeader, 'opacity', rowsIn * 0.7);

        let burnOrder = 0;
        blockRows.forEach((row, index) => {
            if (presentation.isRelevant && index === presentation.ownRow) {
                const lift = progressBetween(
                    elapsed,
                    times.dockedAt + 0.25,
                    times.dockedAt + timing.lift,
                );
                setAttribute(row, 'class', 'art-keep');
                setAttribute(row, 'transform', `translate(0 ${(-1.6 * lift).toFixed(2)})`);
                setAttribute(row, 'opacity', elapsed < times.dockedAt + timing.lift ? rowsIn : 0);

                return;
            }

            const rowAge = elapsed - (times.stripAt + burnOrder * timing.rowGap);
            const crumbled = progressBetween(
                rowAge,
                timing.rowTint,
                timing.rowTint + timing.rowCrumble,
            );
            const rowCenterX = -16 + (BLOCK_ROW_WIDTHS[index] ?? 0) / 2;
            let rowClass = 'art-ash';
            if (rowAge < 0) {
                rowClass = 'art-cell';
            } else if (rowAge < timing.rowTint) {
                rowClass = 'art-ember';
            }
            burnOrder++;
            setAttribute(row, 'class', rowClass);
            setAttribute(
                row,
                'transform',
                getScaleTransform(1 - easeIn(crumbled), 1, rowCenterX, 0),
            );
            setAttribute(row, 'opacity', rowsIn * (1 - Math.pow(crumbled, 1.5)));
        });

        const glowAge = elapsed - times.stripAt;
        setAttribute(
            nodes.boxGlow,
            'opacity',
            glowAge < 0 ? 0 : Math.min(1, glowAge / 0.12) * Math.exp(-glowAge / 0.55),
        );

        return (
            progressBetween(elapsed, times.backAt, times.dockedAt) *
            (1 - progressBetween(elapsed, times.stripAt + timing.closeAfter, times.end))
        );
    };

    const drawFull = (time: number) => {
        const presentation = state.full;

        if (!presentation) {
            setVisible(nodes.lit, false);
            setVisible(nodes.box, false);
            setVisible(nodes.mover, false);
            setAttribute(nodes.gridGroup, 'opacity', 1);
            setAttribute(litLabel, 'opacity', 0);
            setAttribute(streamLabel, 'opacity', 1);

            return;
        }

        drawLitCircuit(presentation, time);

        if (presentation.kind === 'tx') {
            drawArrivedTransaction(presentation, time);
            setAttribute(nodes.gridGroup, 'opacity', 1);
        } else {
            setAttribute(
                nodes.gridGroup,
                'opacity',
                1 - 0.55 * drawArrivedBlock(presentation, time),
            );
        }
    };

    // A compact fetch only blinks its circuit's core (no packet, no relays), rate limited and never
    // while the full presentation still has its circuit lit: there is never more than one lit circuit.
    const drawCompact = (time: number) => {
        const timing = MOTION.compact;
        const blinking = state.presentations.findLast(
            presentation =>
                !presentation.isFull &&
                presentation.hasBlink &&
                presentation.cancelledAt === null &&
                time - presentation.startedAt < timing.blink + timing.blinkFade,
        );
        const isShown = !!blinking && getLitVisibility(state.full, time) <= 0;
        setVisible(nodes.blink, isShown);

        if (!blinking || !isShown) return;

        const elapsed = time - blinking.startedAt;
        const opacity =
            timing.alpha *
            progressBetween(elapsed, 0, 0.15) *
            (1 - progressBetween(elapsed, timing.blink, timing.blink + timing.blinkFade));
        setAttribute(nodes.blink, 'd', routes[getCircuitKey(blinking.identity)].path);
        setAttribute(nodes.blink, 'opacity', opacity);
    };

    const draw = (time: number) => {
        drawStream();
        drawQueueAndSweep(time);
        drawBurns(time);
        drawMatches(time);
        drawTray(time);
        drawFull(time);
        drawCompact(time);
    };

    // Reduced motion: one composed still per stage, explicitly a diagram. Its circuit has no number
    // and the tray shows only what this discovery really found so far (often nothing).
    const drawStill = () => {
        resetPresentation();
        const { stage } = state;
        state.streamAlpha = MOTION.stream.idle.alpha + (stage === 'mempool' ? 0.12 : 0.2);
        startBatch(0);
        state.pourStartedAt = null;
        // The next block batch is already downloaded; mempool filters are a single download.
        state.queueFill = stage === 'block' ? 1 : 0;

        const { batch } = state;

        if (batch) {
            const burntColumns = stage === 'block' ? 5 : 6;
            Object.assign(batch, {
                startedAt: -10,
                burntColumns,
                sweep:
                    (getColumnX(burntColumns) + CELL_SIZE * 0.5 - (GRID.x - 3)) / (GRID.width + 6),
            });

            // One column just checked (warm), one already ash and three frozen flakes: the discard
            // without a flame.
            [
                { column: burntColumns - 1, still: { scale: 0.94, ember: 0.75, ash: 0.35 } },
                { column: burntColumns - 2, still: { scale: 0.62, ember: 0, ash: 0.75 } },
            ].forEach(({ column, still }, index) => {
                const slot = burnSlots[index];

                if (!slot) return;

                Object.assign(slot, { column, still });
                setAttribute(slot.ember, 'fill', getPatternFill('Ember'));
                setAttribute(slot.ash, 'fill', getPatternFill('Ash'));
                setAttribute(slot.ember, 'x', getColumnX(column));
                setAttribute(slot.ash, 'x', getColumnX(column));
            });

            const ashX = getColumnX(burntColumns - 2) + CELL_SIZE / 2;
            [
                { x: ashX - 3, y: getRowY(2) + 7, age: 0.3 },
                { x: ashX + 4, y: getRowY(3) + 8, age: 0.42 },
                { x: ashX - 1, y: getRowY(4) + 10, age: 0.55 },
            ].forEach(({ x, y, age }, index) => {
                const flake = flakes[index];

                if (flake) {
                    Object.assign(flake, {
                        isLive: true,
                        startedAt: -age,
                        x,
                        y,
                        life: 1,
                        drift: 0,
                        fall: 0,
                        radius: 1.25,
                    });
                }
            });
        }

        // A matching filter and its block on the way back, as a diagram: it adds nothing to the tray.
        const presentation = startPresentation(0, STILL_CIRCUIT, labels.genericCircuit);
        const doneAfter = MOTION.fetch.outAt + MOTION.fetch.out[presentation.kind] + 0.6;
        const times = getFetchTimes(presentation.kind, true, doneAfter);
        const elapsed = times.returnAt + (times.backAt - times.returnAt) * 0.7;
        Object.assign(presentation, {
            startedAt: -elapsed,
            doneAt: doneAfter - elapsed,
            isRelevant: true,
            holdsCell: true,
        });
        state.open = null;
        state.pillsAt = -Infinity;
        updateStreamLabel();
        updateCircuitLabel(presentation);
        draw(0);
        // A diagram: both labels stay fully readable.
        setAttribute(streamLabel, 'opacity', 1);
    };

    return {
        // The visible part of the viewBox, so edge fades and labels follow the card width.
        setView(x0: number, x1: number) {
            view.x0 = x0;
            view.x1 = x1;
        },

        setLabels(nextLabels: IllustrationLabels) {
            labels = nextLabels;
        },

        relayout() {
            if (isStill) {
                drawStill();

                return;
            }

            updateStreamLabel();
            updateCircuitLabel(state.full);
        },

        setReducedMotion(isReducedMotion: boolean) {
            isStill = isReducedMotion;

            if (isStill) {
                drawStill();
            } else {
                resetPresentation();
                updateStreamLabel();
                draw(0);
            }
        },

        setStage(stage: DiscoveryStage) {
            if (stage === state.stage && state.hasStage) return;

            // Whatever the block stage still had queued is not mempool data.
            if (state.hasStage) state.queueFill = 0;
            state.stage = stage;
            state.hasStage = true;

            if (isStill) {
                drawStill();
            } else {
                updateStreamLabel();
            }
        },

        setDownloading(isDownloading: boolean) {
            state.isDownloading = isDownloading;
        },

        beginBatch(time: number) {
            if (isStill) return;

            const { batch } = state;

            // The sweep doesn't restart mid-batch: it catches up, and batches that arrive meanwhile
            // are skipped visually. The counter below the art is always the true one.
            if (batch && batch.sweep < 1 && batch.stage === state.stage) {
                state.hasPendingBatch = true;
            } else {
                startBatch(time);
            }
        },

        setSweepTarget(fraction: number) {
            state.sweepTarget = clamp01(fraction);
            state.hasSweepTarget = true;
        },

        fetchStart(time: number, identity: FetchIdentityIndex) {
            // Real fetches are sequential; a second start without a done would be a protocol anomaly,
            // so the old one is closed quietly.
            if (state.open) fetchCancel(time, state.open.handle);

            if (isStill) return ++handleSequence;

            return startPresentation(time, identity).handle;
        },

        fetchDone(time: number, handle: number, isRelevant: boolean) {
            if (isStill) {
                // The still itself doesn't change, only the tray gets one more dot.
                if (isRelevant) {
                    state.kept.push({ isRing: state.stage === 'mempool', landsAt: -1 });
                    drawTray(0);
                }

                return;
            }

            const presentation = findPresentation(handle);

            // Unknown or already closed: never touch another presentation.
            if (!presentation) return;
            if (presentation.doneAt !== null) return;

            presentation.doneAt = time;
            presentation.isRelevant = isRelevant;

            if (state.open === presentation) state.open = null;

            if (isRelevant) {
                presentation.keptIndex = state.kept.length;
                state.kept.push({
                    isRing: presentation.kind === 'tx',
                    landsAt: presentation.isFull ? null : time + MOTION.compact.keptDelay,
                });
            }
        },

        fetchCancel,

        update(time: number, delta: number) {
            const mode = getStreamMode();
            state.streamAlpha +=
                (MOTION.stream[mode].alpha - state.streamAlpha) * Math.min(1, delta / 0.25);
            state.streamOffset += delta * MOTION.stream[mode].rate;

            if (state.pourStartedAt !== null && time >= state.pourStartedAt + MOTION.pour) {
                state.pourStartedAt = null;
                state.queueFill = 0;
            }

            if (state.pourStartedAt === null && state.isDownloading) {
                state.queueFill = Math.min(1, state.queueFill + delta / MOTION.fill[state.stage]);
            }

            const { batch } = state;

            // The check line waits only while a real fetch is open, just as the scan awaits the fetch.
            if (batch && !state.open && time >= batch.startedAt + MOTION.pour && batch.sweep < 1) {
                const isBehind = state.hasPendingBatch || state.sweepTarget > batch.sweep;
                const step = (delta / batch.sweepDuration) * (isBehind ? MOTION.catchUp : 1);
                const limit =
                    state.hasSweepTarget && !state.hasPendingBatch
                        ? state.sweepTarget + MOTION.lead / batch.sweepDuration
                        : 1;
                batch.sweep = Math.min(
                    1,
                    Math.max(batch.sweep, Math.min(limit, batch.sweep + step)),
                );

                if (batch.sweep >= 1) batch.doneAt = time;
            }

            while (
                batch &&
                batch.burntColumns < GRID.columns &&
                getCheckLineX(batch.sweep) >= getColumnX(batch.burntColumns) + CELL_SIZE * 0.6
            ) {
                burnColumn(batch.burntColumns, time, batch.seed);
                batch.burntColumns++;
            }

            if (batch && state.hasPendingBatch && batch.sweep >= 1 && !state.open) startBatch(time);

            state.presentations.forEach(presentation => {
                const elapsed = time - presentation.startedAt;

                if (
                    presentation.isSolo &&
                    !presentation.isSoloBurnt &&
                    elapsed >= getCellEnd(presentation) - MOTION.fetch.cellFade
                ) {
                    presentation.isSoloBurnt = true;
                    burnColumn(presentation.column, time, presentation.handle);
                }

                if (presentation.isFull) {
                    emitFullBeats(presentation, time);
                } else if (
                    presentation.doneAt !== null &&
                    elapsed >=
                        Math.max(
                            getCellEnd(presentation),
                            MOTION.compact.blink + MOTION.compact.blinkFade,
                        )
                ) {
                    presentation.hasEnded = true;
                }

                if (!presentation.hasEnded) return;

                if (state.full === presentation) {
                    setAttribute(bases[getCircuitKey(presentation.identity)], 'opacity', 1);
                    state.full = null;
                    state.lastFullEndAt = time;
                }

                setVisible(presentation.cell.square, false);
                setVisible(presentation.cell.dot, false);
            });
            state.presentations = state.presentations.filter(
                presentation => !presentation.hasEnded,
            );

            burnSlots.forEach(slot => {
                const hasCrumbled = time - slot.startedAt > MOTION.burn.tint + MOTION.burn.crumble;

                if (slot.column >= 0 && !slot.still && hasCrumbled) slot.column = -1;
            });
            flakes.forEach(flake => {
                if (flake.isLive && time - flake.startedAt > flake.life) flake.isLive = false;
            });
        },

        draw,

        // The idle scene is slow; only fetch presentations need the full frame rate.
        needsFullRate: () => state.presentations.length > 0,
    };
};
