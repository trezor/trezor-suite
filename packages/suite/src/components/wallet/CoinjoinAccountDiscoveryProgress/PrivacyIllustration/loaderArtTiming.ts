// Timing of the illustration, in seconds.

export type FetchKind = 'block' | 'tx';

export type FetchTimes = {
    outEnd: number;
    returnAt: number;
    backAt: number;
    dockedAt: number;
    stripAt: number;
    end: number;
    cancel: number | null;
};

export const MOTION = {
    pour: 0.45,
    sweep: { block: 1.7, mempool: 9 },
    // A sweep behind the real scan catches up at most this much faster.
    catchUp: 3,
    // How far the sweep may run ahead of the last reported progress, in seconds of sweeping.
    lead: 1.2,
    fill: { block: 1.3, mempool: 1.4 },
    stream: {
        block: { rate: 30, dash: '0.01 8', alpha: 0.66 },
        mempool: { rate: 54, dash: '0.01 5', alpha: 0.66 },
        // After the mempool filters, the subscription keeps pushing new mempool transactions.
        trickle: { rate: 11, dash: '0.01 13', alpha: 0.42 },
        idle: { rate: 0, dash: '0.01 8', alpha: 0.16 },
    },
    burn: { tint: 0.15, crumble: 0.45 },
    fetch: {
        outAt: 0.2,
        out: { block: 1.1, tx: 1.0 },
        minDwell: 0.3,
        back: { block: 1.2, tx: 1.0 },
        dock: 0.35,
        land: 0.65,
        txFade: 0.55,
        lift: 0.45,
        liftEnd: 1.0,
        burnRelevant: 1.05,
        burnChance: 0.4,
        rowGap: 0.06,
        rowTint: 0.12,
        rowCrumble: 0.4,
        closeAfter: 0.9,
        close: 0.35,
        litFade: 0.6,
        cellHold: 0.25,
        cellFade: 0.2,
        cancel: 0.4,
    },
    compact: { blink: 0.7, blinkFade: 0.25, keptDelay: 0.15, alpha: 0.6 },
    pulse: 0.4,
};

// Calm limits: a full light-up at most once per `minGap` (`busyGap` once two compact fetches came
// since the last one, i.e. a mixing account), never sooner than `rest` after the last one ended.
// Compact core blinks at most once per `blinkGap`, never while the full circuit is still lit.
export const COOLDOWN = { minGap: 8, busyGap: 12, rest: 2.5, blinkGap: 2 };

// Phase boundaries of one full presentation, relative to its start. If the real fetch takes longer
// than the outbound animation, the lit circuit waits until the fetch is done.
export const getFetchTimes = (
    kind: FetchKind,
    isRelevant: boolean,
    doneAfter: number | null,
): FetchTimes => {
    const timing = MOTION.fetch;
    const outEnd = timing.outAt + timing.out[kind];
    const returnAt = Math.max(outEnd + timing.minDwell, doneAfter ?? Infinity);
    const backAt = returnAt + timing.back[kind];

    if (kind === 'tx') {
        const end = backAt + (isRelevant ? timing.land : timing.txFade);

        return {
            outEnd,
            returnAt,
            backAt,
            dockedAt: Infinity,
            stripAt: Infinity,
            end,
            cancel: null,
        };
    }

    const dockedAt = backAt + timing.dock;
    const stripAt = dockedAt + (isRelevant ? timing.burnRelevant : timing.burnChance);
    const end = stripAt + timing.closeAfter + timing.close;

    return { outEnd, returnAt, backAt, dockedAt, stripAt, end, cancel: null };
};
