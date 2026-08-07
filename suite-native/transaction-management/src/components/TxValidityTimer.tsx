import { Badge, Button, HStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type TxValidityTimerProps = {
    secondsLeft: number;
    isPastDeadline: boolean;
    isBroadcasting?: boolean;
    onRetry: () => void;
    isRetryDisabled?: boolean;
    retryTestID?: string;
    isCompact?: boolean;
};

export const TxValidityTimer = ({
    secondsLeft,
    isPastDeadline,
    isBroadcasting = false,
    onRetry,
    isRetryDisabled = false,
    retryTestID,
    isCompact = false,
}: TxValidityTimerProps) => {
    const getLabel = () => {
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
    };

    const badge = <Badge intent="warning" size="medium" label={getLabel()} />;
    const retryButton = (
        <Button
            size="medium"
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
