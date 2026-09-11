import { Badge, Button, HStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useMemo } from 'react';

interface TxValidityTimerBadgeProps {
    isPastDeadline: boolean;
    isBroadcasting?: boolean;
    secondsLeft: number;
}

const TxValidityTimerBadge = ({
    isPastDeadline,
    isBroadcasting,
    secondsLeft,
}: TxValidityTimerBadgeProps) => {
    const label = useMemo(() => {
        if (isBroadcasting) {
            return <Translation id="transactionManagement.txValidityTimer.confirming" />;
        }

        if (isPastDeadline) {
            return <Translation id="transactionManagement.txValidityTimer.expiredTitle" />;
        }

        return (
            <Translation
                id="transactionManagement.txValidityTimer.countdown"
                values={{ seconds: secondsLeft }}
            />
        );
    }, [isBroadcasting, isPastDeadline, secondsLeft]);

    return <Badge intent="warning" size="medium" label={label} />;
};

interface TxValidityTimerRetryButtonProps {
    onRetry: () => void;
    isBroadcasting?: boolean;
    isRetryDisabled?: boolean;
    retryTestID?: string;
}

const TxValidityTimerRetryButton = ({
    onRetry,
    isBroadcasting,
    isRetryDisabled,
    retryTestID,
}: TxValidityTimerRetryButtonProps) => {
    return (
        <Button
            size="small"
            intent="neutral"
            priority="secondary"
            iconLeft="arrowsCounterClockwise"
            isDisabled={isBroadcasting || isRetryDisabled}
            onPress={onRetry}
            testID={retryTestID}
        >
            <Translation id="generic.buttons.tryAgain" />
        </Button>
    );
};

interface TxValidityTimerProps {
    secondsLeft: number;
    isPastDeadline: boolean;
    isBroadcasting?: boolean;
    onRetry: () => void;
    isRetryDisabled?: boolean;
    retryTestID?: string;
    isCompact?: boolean;
}

export const TxValidityTimer = ({
    secondsLeft,
    isPastDeadline,
    isBroadcasting = false,
    onRetry,
    isRetryDisabled = false,
    retryTestID,
    isCompact = false,
}: TxValidityTimerProps) => {
    const badge = (
        <TxValidityTimerBadge
            isPastDeadline={isPastDeadline}
            isBroadcasting={isBroadcasting}
            secondsLeft={secondsLeft}
        />
    );

    const retryButton = (
        <TxValidityTimerRetryButton
            onRetry={onRetry}
            isBroadcasting={isBroadcasting}
            isRetryDisabled={isRetryDisabled}
            retryTestID={retryTestID}
        />
    );

    if (isCompact) {
        return (
            <HStack spacing="sp8" alignItems="center" flexShrink={1}>
                {retryButton}
                {badge}
            </HStack>
        );
    }

    return (
        <HStack paddingVertical="sp8" justifyContent="space-between" alignItems="center">
            {badge}
            {retryButton}
        </HStack>
    );
};
