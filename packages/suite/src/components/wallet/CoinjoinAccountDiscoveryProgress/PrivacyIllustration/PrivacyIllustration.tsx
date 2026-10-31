import { type Ref, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef } from 'react';

import { type TranslationFunction, useTranslation } from '@suite/intl';
import { type ScanProgressInfo } from '@trezor/coinjoin';
import { useFreshRef } from '@trezor/react-utils';

import { ILLUSTRATION_DESCRIPTION } from '../discoveryCopy';
import { IllustrationDynamicLayer } from './IllustrationDynamicLayer';
import { IllustrationStaticLayer } from './IllustrationStaticLayer';
import { IllustrationFrame } from './PrivacyIllustration.styles';
import {
    type DiscoveryStage,
    type IllustrationBeat,
    type IllustrationLabels,
    type IllustrationPatternIds,
    type LoaderArt,
    createLoaderArt,
} from './createLoaderArt';
import { createScanEventAdapter } from './createScanEventAdapter';
import { CENTER_X, VIEW_WIDTH, formatCoordinate } from './illustrationGeometry';

// Frame budget in ms: about 30 fps while idle, at most 60 fps while a fetch is presented (also on
// 120 Hz displays).
const IDLE_FRAME_INTERVAL = 31;
const ACTIVE_FRAME_INTERVAL = 15.5;
const MAX_FRAME_DELTA = 0.25;

// Same clock as requestAnimationFrame timestamps, in seconds.
const getTime = () => performance.now() / 1000;

const getPatternIds = (idPrefix: string): IllustrationPatternIds => ({
    square: `${idPrefix}-square`,
    round: `${idPrefix}-round`,
    squareEmber: `${idPrefix}-square-ember`,
    roundEmber: `${idPrefix}-round-ember`,
    squareAsh: `${idPrefix}-square-ash`,
    roundAsh: `${idPrefix}-round-ash`,
});

const getIllustrationLabels = (translationString: TranslationFunction): IllustrationLabels => {
    const getCircuitLabel = (number: number) =>
        translationString('TR_COINJOIN_DISCOVERY_LABEL_TOR_CIRCUIT_NUMBER', { number });

    return {
        blockStream: translationString('TR_COINJOIN_DISCOVERY_LABEL_BLOCK_FILTERS'),
        mempoolStream: translationString('TR_COINJOIN_DISCOVERY_LABEL_MEMPOOL'),
        genericCircuit: translationString('TR_COINJOIN_DISCOVERY_LABEL_TOR_CIRCUIT'),
        circuits: {
            0: getCircuitLabel(1),
            1: getCircuitLabel(2),
            2: getCircuitLabel(3),
            3: getCircuitLabel(4),
        },
    };
};

export type PrivacyIllustrationHandle = {
    handleScanEvent: (info: ScanProgressInfo) => void;
};

type PrivacyIllustrationProps = {
    ref?: Ref<PrivacyIllustrationHandle>;
    stage: DiscoveryStage;
    isReducedMotion: boolean;
    onBeat: (time: number, beat: IllustrationBeat) => void;
};

/**
 * This computer in the Tor network, downloading filters, checking them locally and fetching only
 * what matches. Scan events drive an imperative renderer that only writes SVG attributes, so the
 * animation never re-renders React.
 */
export const PrivacyIllustration = ({
    ref,
    stage,
    isReducedMotion,
    onBeat,
}: PrivacyIllustrationProps) => {
    const { translationString } = useTranslation();
    // Gradient, pattern and clip ids are document-global.
    const idPrefix = `privacy-art-${useId().replace(/[^\w-]/g, '')}`;
    const frameRef = useRef<HTMLDivElement>(null);
    const staticLayerRef = useRef<SVGSVGElement>(null);
    const dynamicLayerRef = useRef<SVGSVGElement>(null);
    const artRef = useRef<LoaderArt | null>(null);
    const adapterRef = useRef<ReturnType<typeof createScanEventAdapter> | null>(null);
    const onBeatRef = useFreshRef(onBeat);

    useImperativeHandle(
        ref,
        () => ({ handleScanEvent: info => adapterRef.current?.handle(getTime(), info) }),
        [],
    );

    useLayoutEffect(() => {
        const staticLayer = staticLayerRef.current;
        const dynamicLayer = dynamicLayerRef.current;

        if (!staticLayer || !dynamicLayer) return;

        const art = createLoaderArt({
            staticLayer,
            dynamicLayer,
            patternIds: getPatternIds(idPrefix),
            onBeat: (time, beat) => onBeatRef.current(time, beat),
        });

        if (!art) return;

        const adapter = createScanEventAdapter(art);
        artRef.current = art;
        adapterRef.current = adapter;

        return () => {
            adapter.close(getTime());
            artRef.current = null;
            adapterRef.current = null;
        };
    }, [idPrefix, onBeatRef]);

    useLayoutEffect(() => {
        const art = artRef.current;

        if (!art) return;

        art.setLabels(getIllustrationLabels(translationString));
        art.relayout();
    }, [translationString]);

    useLayoutEffect(() => {
        artRef.current?.setReducedMotion(isReducedMotion);
    }, [isReducedMotion]);

    // The visible part of the viewBox: edge fades and label placement follow the card width.
    useLayoutEffect(() => {
        const frame = frameRef.current;
        const art = artRef.current;

        if (!frame || !art) return;

        let isMounted = true;
        const gradients = frame.querySelectorAll('[data-view-gradient]');
        const observer = new ResizeObserver(([entry]) => {
            const visibleWidth = Math.min(VIEW_WIDTH, entry?.contentRect.width || VIEW_WIDTH);
            const x0 = CENTER_X - visibleWidth / 2;
            const x1 = CENTER_X + visibleWidth / 2;
            art.setView(x0, x1);
            gradients.forEach(gradient => {
                gradient.setAttribute('x1', formatCoordinate(x0));
                gradient.setAttribute('x2', formatCoordinate(x1));
            });
            art.relayout();
        });
        observer.observe(frame);
        // Labels are measured in the real font, which may still be loading.
        document.fonts.ready.then(() => {
            if (isMounted) art.relayout();
        });

        return () => {
            isMounted = false;
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        const frame = frameRef.current;
        const art = artRef.current;

        // Reduced motion shows a still drawn once per change, without an animation loop.
        if (!frame || !art || isReducedMotion) return;

        let frameId: number | null = null;
        let lastTime = getTime();
        let lastDrawAt = 0;

        const tick = (timestamp: number) => {
            frameId = requestAnimationFrame(tick);
            const time = timestamp / 1000;
            art.update(time, Math.min(MAX_FRAME_DELTA, Math.max(0, time - lastTime)));
            lastTime = time;

            if (
                timestamp - lastDrawAt >=
                (art.needsFullRate() ? ACTIVE_FRAME_INTERVAL : IDLE_FRAME_INTERVAL)
            ) {
                lastDrawAt = timestamp;
                art.draw(time);
            }
        };
        const start = () => {
            if (frameId !== null) return;

            lastTime = getTime();
            frameId = requestAnimationFrame(tick);
        };
        const stop = () => {
            if (frameId !== null) cancelAnimationFrame(frameId);
            frameId = null;
        };
        // Nothing needs drawing while the card is scrolled out of view. Entries queue up between
        // callbacks, and only the latest one is current.
        const observer = new IntersectionObserver(entries =>
            entries.at(-1)?.isIntersecting ? start() : stop(),
        );
        observer.observe(frame);

        return () => {
            observer.disconnect();
            stop();
        };
    }, [isReducedMotion]);

    const description = ILLUSTRATION_DESCRIPTION[stage]
        .map(key => translationString(key))
        .join(' ');

    return (
        <IllustrationFrame ref={frameRef}>
            <IllustrationStaticLayer
                ref={staticLayerRef}
                idPrefix={idPrefix}
                computerLabel={translationString('TR_COINJOIN_DISCOVERY_LABEL_THIS_COMPUTER')}
            />
            <IllustrationDynamicLayer
                ref={dynamicLayerRef}
                idPrefix={idPrefix}
                patternIds={getPatternIds(idPrefix)}
                description={description}
            />
        </IllustrationFrame>
    );
};
