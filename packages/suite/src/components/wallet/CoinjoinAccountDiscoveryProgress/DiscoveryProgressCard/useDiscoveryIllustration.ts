import { useEffect, useState } from 'react';

import { type FetchIdentityIndex, type ScanProgressInfo } from '@trezor/coinjoin';
import { exhaustive } from '@trezor/type-utils';

// Light-ups are at least 8 s apart, so minutes of discovery stay calm; the fetches between them
// only hold the scan and fill the tray. A request is shown going out for at least 1.6 s, then the
// result takes 3.2 s until your transaction has landed in the tray.
const LIGHT_UP_INTERVAL_MS = 8000;
const MIN_OUTBOUND_MS = 1600;
const RESULT_MS = 3200;
// The backend reports a done for every fetch, even a failed one, so this only guards against a
// lost done. It outlasts a slow request over Tor, whose every attempt times out after 35 s.
const FETCH_TIMEOUT_MS = 40000;

export type DiscoveryStage = ScanProgressInfo['stage'];

export type DiscoveryIllustrationState = {
    stage: DiscoveryStage;
    activity?: 'fetch' | 'scan-fetch' | 'scan';
    // Nothing is checked or discarded before the stage's scan starts.
    isScanning: boolean;
    isFetchOpen: boolean;
    // Keyed by its start time, so every light-up restarts the circuit's animation.
    lit?: { key: number; identity: FetchIdentityIndex };
    result?: 'keep' | 'burn';
    keptCount: number;
};

type FetchItem = { identity: FetchIdentityIndex; timeout: ReturnType<typeof setTimeout> };

const INITIAL_STATE: DiscoveryIllustrationState = {
    stage: 'block',
    isScanning: false,
    isFetchOpen: false,
    keptCount: 0,
};

// The state lives in this closure, not in React state, because the backend can send several
// events before the next render.
const createIllustrationTracker = (onChange: (state: DiscoveryIllustrationState) => void) => {
    let state = INITIAL_STATE;
    let openFetchItems: FetchItem[] = [];
    let presentedFetchItem: FetchItem | undefined;
    let lastLightUpAt = -LIGHT_UP_INTERVAL_MS;
    let heldKeptCount = 0;
    // The presented fetch found your transaction, but the result isn't shown yet.
    let isPresentedKeepPending = false;
    let presentationTimeout: ReturnType<typeof setTimeout> | undefined;

    const update = (patch: Partial<DiscoveryIllustrationState>) => {
        state = { ...state, ...patch };
        onChange(state);
    };
    const schedule = (callback: () => void, delay: number) => {
        clearTimeout(presentationTimeout);
        presentationTimeout = setTimeout(callback, delay);
    };
    const closeAll = () => {
        clearTimeout(presentationTimeout);
        openFetchItems.forEach(fetchItem => clearTimeout(fetchItem.timeout));
        openFetchItems = [];
    };
    // A stage switch can end the presentation before its keep is shown, and the keep still counts.
    const endPresentation = () => {
        const pendingKeptCount = isPresentedKeepPending ? 1 : 0;

        clearTimeout(presentationTimeout);
        presentedFetchItem = undefined;
        update({
            lit: undefined,
            result: undefined,
            keptCount: state.keptCount + heldKeptCount + pendingKeptCount,
        });
        heldKeptCount = 0;
        isPresentedKeepPending = false;
    };
    const closeFetchItem = (fetchItem: FetchItem) => {
        clearTimeout(fetchItem.timeout);
        openFetchItems = openFetchItems.filter(openFetchItem => openFetchItem !== fetchItem);
        update({ isFetchOpen: openFetchItems.length > 0 });
    };
    // Your transactions found during a presentation join the tray after it, so the presented one
    // lands in its own slot.
    const addKept = () => {
        if (state.lit) {
            heldKeptCount += 1;
        } else {
            update({ keptCount: state.keptCount + 1 });
        }
    };
    const showResult = (isRelevant: boolean) => {
        isPresentedKeepPending = false;
        if (isRelevant) {
            update({ result: 'keep', keptCount: state.keptCount + 1 });
        } else {
            update({ result: 'burn' });
        }
        schedule(endPresentation, RESULT_MS);
    };

    const onFetchItem = (identity: FetchIdentityIndex, isReducedMotion: boolean) => {
        const fetchItem: FetchItem = {
            identity,
            // One timeout per fetch, so later fetches can't keep a lost one open.
            timeout: setTimeout(() => {
                closeFetchItem(fetchItem);
                if (fetchItem === presentedFetchItem) endPresentation();
            }, FETCH_TIMEOUT_MS),
        };
        openFetchItems = [...openFetchItems, fetchItem];
        // A fetch follows a match, so it also tells a card mounted mid-stage that the scan runs.
        update({ isFetchOpen: true, isScanning: true });

        const now = performance.now();

        if (isReducedMotion || state.lit || now - lastLightUpAt < LIGHT_UP_INTERVAL_MS) return;

        presentedFetchItem = fetchItem;
        lastLightUpAt = now;
        update({ lit: { key: now, identity } });
    };

    const onFetchItemDone = (identity: FetchIdentityIndex, isRelevant: boolean) => {
        // Events carry no fetch id, so a done closes the oldest open fetch of its identity. A done
        // with nothing to close is stray and can't decide what the presented fetch brought back.
        const fetchItem = openFetchItems.find(openFetchItem => openFetchItem.identity === identity);

        if (fetchItem) closeFetchItem(fetchItem);

        if (fetchItem === undefined || fetchItem !== presentedFetchItem) {
            if (isRelevant) addKept();

            return;
        }

        presentedFetchItem = undefined;
        isPresentedKeepPending = isRelevant;
        // The packet turns back once the request has been shown and the real fetch has ended.
        schedule(() => showResult(isRelevant), lastLightUpAt + MIN_OUTBOUND_MS - performance.now());
    };

    const onProgressInfo = (info: ScanProgressInfo, isReducedMotion: boolean) => {
        // The stage only moves forward, so a late block event can't take the mempool stage back.
        if (info.stage === 'mempool' && state.stage === 'block') {
            closeAll();
            endPresentation();
            update({ stage: 'mempool', isScanning: false, isFetchOpen: false });
        }

        if (!('activity' in info)) {
            // Progress is only reported while filters are checked, so a card mounted mid-stage
            // learns from it that the scan runs.
            if (info.stage === state.stage && !state.isScanning) update({ isScanning: true });

            return;
        }

        // Of an earlier stage's events, only the transactions found still count.
        if (info.stage !== state.stage) {
            if (info.activity === 'fetch-item-done' && info.relevant) addKept();

            return;
        }

        switch (info.activity) {
            case 'fetch-item':
                onFetchItem(info.identity, isReducedMotion);
                break;
            case 'fetch-item-done':
                onFetchItemDone(info.identity, info.relevant);
                break;
            case 'fetch':
            case 'scan-fetch':
            case 'scan':
                update({
                    activity: info.activity,
                    isScanning: state.isScanning || info.activity !== 'fetch',
                });
                break;
            default:
                exhaustive(info);
        }
    };

    return { onProgressInfo, destroy: closeAll };
};

/**
 * What the Privacy account illustration shows, from the real scan events. Only a real fetch
 * lights a circuit, one at a time.
 */
export const useDiscoveryIllustration = (isReducedMotion: boolean) => {
    const [illustration, setIllustration] = useState(INITIAL_STATE);
    const [tracker] = useState(() => createIllustrationTracker(setIllustration));

    useEffect(() => tracker.destroy, [tracker]);

    const onProgressInfo = (info: ScanProgressInfo) =>
        tracker.onProgressInfo(info, isReducedMotion);

    return { illustration, onProgressInfo };
};
