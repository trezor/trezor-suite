import { type DiscoveryStage } from './PrivacyIllustration/createLoaderArt';
import { CAPTION_ROTATION, type CaptionId } from './discoveryCopy';

// Seconds. A caption rotates after `rotate`; an event caption needs the current one to be at least
// `minAge` old and is not repeated within `repeat`; a new stage waits until the current caption
// was readable for `stageMin`.
const TIMING = { rotate: 7.5, minAge: 1.5, repeat: 25, stageMin: 3 };

/**
 * Decides which caption is shown: a calm rotation of how discovery works, interrupted by event
 * captions when the illustration presents a real fetch. Nothing is shown before the first stage.
 */
export const createCaptionScheduler = (onShow: (caption: CaptionId) => void) => {
    let stage: DiscoveryStage | null = null;
    let current: CaptionId | null = null;
    let shownAt = -Infinity;
    let rotationIndex = 0;
    let pendingStageCaption: CaptionId | null = null;
    const lastShownAt = new Map<CaptionId, number>();

    const show = (time: number, caption: CaptionId) => {
        if (caption === current) return;

        current = caption;
        shownAt = time;
        lastShownAt.set(caption, time);
        onShow(caption);
    };

    return {
        setStage(time: number, nextStage: DiscoveryStage) {
            const [firstCaption] = CAPTION_ROTATION[nextStage];
            stage = nextStage;
            rotationIndex = 0;
            pendingStageCaption = firstCaption ?? null;

            if (firstCaption && time - shownAt >= TIMING.stageMin) {
                pendingStageCaption = null;
                show(time, firstCaption);
            }
        },

        beat(time: number, caption: CaptionId) {
            if (!stage || pendingStageCaption) return;
            if (time - (lastShownAt.get(caption) ?? -Infinity) < TIMING.repeat) return;
            if (time - shownAt < TIMING.minAge) return;

            show(time, caption);
        },

        tick(time: number) {
            if (!stage) return;

            if (pendingStageCaption) {
                if (time - shownAt >= TIMING.stageMin) {
                    show(time, pendingStageCaption);
                    pendingStageCaption = null;
                }

                return;
            }

            if (time - shownAt < TIMING.rotate) return;

            const rotation = CAPTION_ROTATION[stage];
            rotationIndex = (rotationIndex + 1) % rotation.length;

            // Never the same caption twice in a row, e.g. after an event caption.
            if (rotation[rotationIndex] === current) {
                rotationIndex = (rotationIndex + 1) % rotation.length;
            }

            const next = rotation[rotationIndex];

            if (next) show(time, next);
        },
    };
};
