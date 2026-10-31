import { useEffect, useState } from 'react';

import { type DiscoveryStage } from './PrivacyIllustration/createLoaderArt';
import { createCaptionScheduler } from './createCaptionScheduler';
import { type CaptionId } from './discoveryCopy';

const TICK_INTERVAL = 500;

// Same clock as the illustration's animation frames, so event captions and rotation agree.
const getTime = () => performance.now() / 1000;

export const useDiscoveryCaptions = (stage: DiscoveryStage | undefined, isRotating: boolean) => {
    const [caption, setCaption] = useState<CaptionId | null>(null);
    const [scheduler] = useState(() => createCaptionScheduler(setCaption));

    useEffect(() => {
        if (stage) scheduler.setStage(getTime(), stage);
    }, [scheduler, stage]);

    useEffect(() => {
        if (!isRotating) return;

        const interval = setInterval(() => scheduler.tick(getTime()), TICK_INTERVAL);

        return () => clearInterval(interval);
    }, [scheduler, isRotating]);

    return { caption, onBeat: scheduler.beat };
};
