import { useEffect, useState, useCallback } from 'react';
import { SESSION_PHASE_TRANSITION_DELAY } from 'src/constants/suite/coinjoin';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectSessionByAccountKey } from 'src/reducers/wallet/coinjoinReducer';
import { SessionPhase } from 'src/types/wallet/coinjoin';
import { getFirstSessionPhaseFromRoundPhase } from 'src/utils/wallet/coinjoinUtils';

const checkExpiration = (lastChangeTimestamp: number) => {
    const currentTimestamp = Date.now();
    const expirationTimestamp = lastChangeTimestamp + SESSION_PHASE_TRANSITION_DELAY;

    return {
        isExpired: expirationTimestamp <= currentTimestamp,
        currentTimestamp,
        expirationTimestamp,
    };
};

export const useCoinjoinSessionPhase = (accountKey: string) => {
    const { sessionPhaseQueue, roundPhase, paused } =
        useSelector(state => selectSessionByAccountKey(state, accountKey)) || {};
    const [phaseIndex, setPhaseIndex] = useState(0);
    const [lastChangeTimestamp, setLastChangeTimestamp] = useState(0);
    const [sessionPhase, setSessionPhase] = useState<SessionPhase>(() =>
        getFirstSessionPhaseFromRoundPhase(roundPhase),
    );

    const checkNextPhase = useCallback(() => {
        const nextPhaseIndex = phaseIndex + 1;
        const nextPhase = sessionPhaseQueue?.[nextPhaseIndex];
        const { isExpired, currentTimestamp } = checkExpiration(lastChangeTimestamp);

        if (isExpired && nextPhase) {
            setPhaseIndex(nextPhaseIndex);
            setSessionPhase(nextPhase);
            setLastChangeTimestamp(currentTimestamp);
        }
    }, [lastChangeTimestamp, phaseIndex, sessionPhaseQueue]);

    const handleRoundPhaseChange = useCallback(() => {
        // Queue is cleared on Round Phase change
        const { isExpired, currentTimestamp } = checkExpiration(lastChangeTimestamp);

        if (isExpired && sessionPhaseQueue) {
            setPhaseIndex(0);
            setSessionPhase(sessionPhaseQueue[0]);
            setLastChangeTimestamp(currentTimestamp);
        } else {
            /**
             * If the current sessionPhase is not expired, keep it
             * and reset only the phaseIndex to -1 because
             * next phaseIndex should be 0 (first message in the new Round Phase).
             */
            setPhaseIndex(-1);
        }
    }, [lastChangeTimestamp, sessionPhaseQueue]);

    // Handle sessionPhaseQueue change.
    useEffect(() => {
        if (!sessionPhaseQueue?.length) {
            return;
        }

        if (sessionPhaseQueue?.includes(sessionPhase)) {
            checkNextPhase();
        } else {
            handleRoundPhaseChange();
        }
    }, [
        checkNextPhase,
        handleRoundPhaseChange,
        lastChangeTimestamp,
        phaseIndex,
        sessionPhase,
        sessionPhaseQueue,
    ]);

    // Set timer for next expiration check.
    useEffect(() => {
        if (!sessionPhaseQueue?.length) {
            return;
        }

        const { isExpired, currentTimestamp, expirationTimestamp } =
            checkExpiration(lastChangeTimestamp);
        const delay = isExpired
            ? SESSION_PHASE_TRANSITION_DELAY
            : expirationTimestamp - currentTimestamp;

        const timer = setTimeout(checkNextPhase, delay);

        return () => clearTimeout(timer);
    }, [checkNextPhase, lastChangeTimestamp, sessionPhaseQueue]);

    if (paused) {
        return;
    }

    return sessionPhase;
};
