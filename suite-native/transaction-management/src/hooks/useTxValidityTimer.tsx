import { useCallback, useEffect, useRef } from 'react';

import { type NetworkType } from '@suite-common/wallet-config';
import { getTxValidityTimeoutInMs } from '@suite-common/wallet-utils';
import { useAlert } from '@suite-native/alerts';
import { Translation } from '@suite-native/intl';
import TrezorConnect from '@trezor/connect';
import { useClickCooldown, useCountdownTimer } from '@trezor/react-utils';

type UseTxValidityTimerParams = {
    networkType?: NetworkType;
    createdTimestamp: number;
    isBroadcasting: boolean;
    isTransactionAlreadySigned: boolean;
    onRetry: () => void | Promise<void>;
    onCancel: () => void;
};

export const useTxValidityTimer = ({
    networkType,
    createdTimestamp,
    isBroadcasting,
    isTransactionAlreadySigned,
    onRetry,
    onCancel,
}: UseTxValidityTimerParams) => {
    const { showAlert } = useAlert();

    const validityTimeoutMs = getTxValidityTimeoutInMs(networkType);
    const deadline = createdTimestamp + validityTimeoutMs;

    const isValidityTimerRelevant =
        networkType === 'solana' && createdTimestamp > 0 && validityTimeoutMs > 0;

    const { duration, isPastDeadline } = useCountdownTimer(deadline, {
        pastDeadlineLeadMs: 0,
        isEnabled: isValidityTimerRelevant,
    });
    const secondsLeft = (duration.minutes ?? 0) * 60 + (duration.seconds ?? 0);

    const isExpired = isValidityTimerRelevant && !isBroadcasting && isPastDeadline;

    const { handleClick: handleRetryClick, disabled: isRetryOnCooldown } = useClickCooldown();
    const handleRetry = useCallback(() => handleRetryClick(onRetry), [handleRetryClick, onRetry]);

    useEffect(() => {
        if (!isValidityTimerRelevant || isBroadcasting || isTransactionAlreadySigned) return;

        const msUntilDeadline = deadline - Date.now();

        if (msUntilDeadline <= 0) return;

        const timeoutId = setTimeout(() => TrezorConnect.cancel('tx-timeout'), msUntilDeadline);

        return () => clearTimeout(timeoutId);
    }, [isValidityTimerRelevant, isBroadcasting, isTransactionAlreadySigned, deadline]);

    // Alert once per expiry, stable ref avoids re-opening when retry/cancel callbacks change.
    const hasShownExpiredAlertRef = useRef(false);

    useEffect(() => {
        if (!isExpired) {
            hasShownExpiredAlertRef.current = false;

            return;
        }

        if (hasShownExpiredAlertRef.current) {
            return;
        }

        hasShownExpiredAlertRef.current = true;

        showAlert({
            pictogramVariant: 'critical',
            title: <Translation id="transactionManagement.txValidityTimer.expiredAlert.title" />,
            description: (
                <Translation id="transactionManagement.txValidityTimer.expiredAlert.description" />
            ),
            primaryButtonTitle: <Translation id="generic.buttons.tryAgain" />,
            primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
            onPressPrimaryButton: handleRetry,
            secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
            secondaryButtonColorProps: { intent: 'critical', priority: 'secondary' },
            onPressSecondaryButton: onCancel,
        });
    }, [isExpired, showAlert, handleRetry, onCancel]);

    return {
        showTimer: isValidityTimerRelevant,
        secondsLeft,
        isPastDeadline: isExpired,
        isBroadcasting,
        onRetry: handleRetry,
        isRetryDisabled: isRetryOnCooldown,
    };
};
