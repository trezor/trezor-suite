import { useEffect, useState } from 'react';

import { type WaitingCardProps } from '@suite-native/trading-atoms';
import { ProviderConfirmationStatus } from '@suite-native/trading-types';

import { ConfirmationFailed } from './ConfirmationFailed';
import { ConfirmationInProgress } from './ConfirmationInProgress';
import { useProviderConfirmationStatus } from '../../../hooks/general/providerConfirmation/useProviderConfirmationStatus';

const NOT_VISIBLE_STATUSES: ProviderConfirmationStatus[] = [
    'confirmation_success',
    'window_opened',
    'inactive',
] as const;

const PENDING_ANIMATION_STATUSES: ProviderConfirmationStatus[] = [
    'window_closed_with_success',
    'window_closed_incomplete',
] as const;

const FINAL_ANIMATION_STATUSES: ProviderConfirmationStatus[] = [
    'confirmation_success',
    'confirmation_failed',
] as const;

const RESOLVE_ANIMATION_DURATION_MS = 2_000;

export const ProviderConfirmationStatusInfo = () => {
    const status = useProviderConfirmationStatus();

    const [displayStatus, setDisplayStatus] = useState(status);
    const [loadingState, setLoadingState] = useState<WaitingCardProps['loadingState']>('idle');

    useEffect(() => {
        if (
            PENDING_ANIMATION_STATUSES.includes(displayStatus) &&
            FINAL_ANIMATION_STATUSES.includes(status)
        ) {
            setLoadingState(status === 'confirmation_success' ? 'success' : 'error');
            const timeout = setTimeout(() => {
                setDisplayStatus(status);
            }, RESOLVE_ANIMATION_DURATION_MS);

            return () => clearTimeout(timeout);
        } else {
            setLoadingState('idle');
            setDisplayStatus(status);

            return () => {};
        }
    }, [displayStatus, status]);

    if (NOT_VISIBLE_STATUSES.includes(displayStatus)) {
        return null;
    }

    if (displayStatus === 'confirmation_failed') {
        return <ConfirmationFailed />;
    }

    return <ConfirmationInProgress status={displayStatus} loadingState={loadingState} />;
};
