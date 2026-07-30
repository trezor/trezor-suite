import { useEffect, useRef, useState } from 'react';

import { DOT_RINGING_DURATION } from '@trezor/components';

export type ActivityNotificationPhase = 'off' | 'ringing' | 'seen';

/**
 * Drives the Activity nav indicator through three phases:
 * - `off`: no unseen activity, nothing rendered
 * - `ringing`: a new activity arrived, dot pops in and pulses twice
 * - `seen`: pulses finished, static dot persists until Activity is opened
 *
 * A newly arrived activity (transition to `hasUnseenActivity`) triggers `ringing`.
 * Pre-existing unseen activity (e.g. on app start) starts directly in `seen`
 * so the indicator does not re-ring on every mount/navigation.
 */
export const useActivityNotificationPhase = (
    hasUnseenActivity: boolean,
    isActivityOpen: boolean,
): ActivityNotificationPhase => {
    const [phase, setPhase] = useState<ActivityNotificationPhase>(
        hasUnseenActivity ? 'seen' : 'off',
    );
    const hadUnseenActivity = useRef(hasUnseenActivity);

    useEffect(() => {
        if (hasUnseenActivity && !hadUnseenActivity.current) {
            setPhase('ringing');
        } else if (!hasUnseenActivity) {
            setPhase('off');
        }
        hadUnseenActivity.current = hasUnseenActivity;
    }, [hasUnseenActivity]);

    useEffect(() => {
        if (phase !== 'ringing') return;

        const timeout = setTimeout(() => setPhase('seen'), DOT_RINGING_DURATION);

        return () => clearTimeout(timeout);
    }, [phase]);

    useEffect(() => {
        if (isActivityOpen) {
            setPhase('off');
        }
    }, [isActivityOpen]);

    return phase;
};
