import { type ScanProgressInfo } from '@trezor/coinjoin';
import { exhaustive } from '@trezor/type-utils';

import { type DiscoveryStage, type LoaderArt } from './createLoaderArt';

export type ScanEventSink = Pick<
    LoaderArt,
    | 'setStage'
    | 'setDownloading'
    | 'beginBatch'
    | 'setSweepTarget'
    | 'fetchStart'
    | 'fetchDone'
    | 'fetchCancel'
>;

/**
 * Turns the scan's progress events into illustration calls. Only the stage, batch boundaries,
 * progress fractions, the identity index and relevance reach the illustration, never a height.
 */
export const createScanEventAdapter = (sink: ScanEventSink) => {
    let stage: DiscoveryStage | null = null;
    // The batch whose download is pending, and the last one reported as downloaded.
    let pendingFrom: number | null = null;
    let lastScannedFrom: number | null = null;
    let previousFrom: number | null = null;
    let batch: { from: number; span: number } | null = null;
    let openHandle: number | null = null;

    const handleBlockActivity = (
        time: number,
        activity: 'fetch' | 'scan-fetch' | 'scan',
        batchFrom: number,
    ) => {
        switch (activity) {
            // A batch download is pending from a fetch or scan-fetch until a scan with the same
            // batchFrom says it arrived. The final fetch after an up-to-date answer leaves it off.
            case 'fetch':
                previousFrom ??= batchFrom;
                pendingFrom = batchFrom;
                sink.setDownloading(lastScannedFrom !== batchFrom);
                break;
            // The span comes from consecutive batchFrom values, never a fixed batch size (test
            // networks use 5000 instead of 500, and the last batch is shorter).
            case 'scan-fetch':
                batch = {
                    from: previousFrom ?? batchFrom,
                    span: batchFrom - (previousFrom ?? batchFrom),
                };
                previousFrom = batchFrom;
                pendingFrom = batchFrom;
                sink.beginBatch(time);
                sink.setDownloading(true);
                break;
            case 'scan':
                lastScannedFrom = batchFrom;
                if (pendingFrom === batchFrom) sink.setDownloading(false);
                break;
            default:
                exhaustive(activity);
        }
    };

    const handleProgress = (info: ScanProgressInfo) => {
        if (!info.progress) return;

        if (info.stage === 'block') {
            if (batch && batch.span > 0)
                sink.setSweepTarget((info.progress.current - batch.from) / batch.span);

            return;
        }

        // Later mempool iterations only re-check what the first one fetched.
        if (info.progress.iteration === 0 && info.progress.total > 0) {
            sink.setSweepTarget(info.progress.current / info.progress.total);
        }
    };

    const handle = (time: number, info: ScanProgressInfo) => {
        if (info.stage !== stage) {
            stage = info.stage;
            sink.setStage(info.stage);
        }

        handleProgress(info);

        if (!('activity' in info)) return;

        if (info.activity === 'fetch-item') {
            if (openHandle !== null) sink.fetchCancel(time, openHandle);
            openHandle = sink.fetchStart(time, info.identity);

            return;
        }

        if (info.activity === 'fetch-item-done') {
            if (openHandle !== null) sink.fetchDone(time, openHandle, info.relevant === true);
            openHandle = null;

            return;
        }

        if (info.stage === 'block') {
            handleBlockActivity(time, info.activity, info.batchFrom);

            return;
        }

        if (info.activity === 'fetch') {
            sink.setDownloading(true);
        } else {
            sink.setDownloading(false);
            sink.beginBatch(time);
        }
    };

    // The loader goes away (discovery finished or the account changed): nothing stays open.
    const close = (time: number) => {
        if (openHandle !== null) sink.fetchCancel(time, openHandle);
        openHandle = null;
    };

    return { handle, close };
};
