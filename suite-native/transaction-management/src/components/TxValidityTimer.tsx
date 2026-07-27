import { Badge, Button, HStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type TxValidityTimerProps = {
    secondsLeft: number;
    isPastDeadline: boolean;
    isBroadcasting?: boolean;
    onRetry: () => void;
    isRetryDisabled?: boolean;
};

export const TxValidityTimer = ({
    secondsLeft,
    isPastDeadline,
    isBroadcasting = false,
    onRetry,
    isRetryDisabled = false,
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

    return (
        <HStack paddingVertical="sp8" justifyContent="space-between" alignItems="center">
            <Badge intent="warning" size="medium" label={getLabel()} />
            <Button
                size="medium"
                intent="neutral"
                priority="secondary"
                iconLeft="arrowsCounterClockwise"
                isDisabled={isBroadcasting || isRetryDisabled}
                onPress={onRetry}
            >
                <Translation id="generic.buttons.tryAgain" />
            </Button>
        </HStack>
    );
};
