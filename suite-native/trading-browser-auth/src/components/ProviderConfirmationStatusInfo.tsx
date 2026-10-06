import { useEffect, useEffectEvent, useState } from 'react';

import { Box } from '@suite-native/atoms';
import { type WaitingCardProps } from '@suite-native/trading-atoms';
import type { ProviderConfirmationStatus } from '@suite-native/trading-types';

import { ConfirmationFailed } from './ConfirmationFailed';
import { ConfirmationInProgress } from './ConfirmationInProgress';
import { useProviderConfirmationStatus } from '../hooks/useProviderConfirmationStatus';

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

type Props = {
    quoteStatus?: string;
    companyName: string;
    onConfirmationComplete?: (status: 'success' | 'error') => void;
};

export const ProviderConfirmationStatusInfo = ({
    quoteStatus,
    companyName,
    onConfirmationComplete,
}: Props) => {
    const status = useProviderConfirmationStatus();

    const [displayStatus, setDisplayStatus] = useState(status);
    const [loadingState, setLoadingState] = useState<WaitingCardProps['loadingState']>('idle');
    const notifyConfirmationComplete = useEffectEvent((finalStatus: 'success' | 'error') => {
        onConfirmationComplete?.(finalStatus);
    });

    useEffect(() => {
        if (
            PENDING_ANIMATION_STATUSES.includes(displayStatus) &&
            FINAL_ANIMATION_STATUSES.includes(status)
        ) {
            setLoadingState(status === 'confirmation_success' ? 'success' : 'error');
        } else {
            setLoadingState('idle');
            setDisplayStatus(status);
        }
    }, [displayStatus, status]);

    useEffect(() => {
        if (displayStatus === 'confirmation_success') {
            notifyConfirmationComplete('success');
        } else if (displayStatus === 'confirmation_failed') {
            notifyConfirmationComplete('error');
        }
    }, [displayStatus]);

    const handleComplete = () => {
        setDisplayStatus(status);
    };

    if (displayStatus === 'confirmation_failed' || quoteStatus === 'ERROR') {
        return <ConfirmationFailed />;
    }

    if (NOT_VISIBLE_STATUSES.includes(displayStatus)) {
        return null;
    }

    return (
        <Box paddingBottom="sp8">
            <ConfirmationInProgress
                loadingState={loadingState}
                companyName={companyName}
                onConfirmationComplete={handleComplete}
            />
        </Box>
    );
};
