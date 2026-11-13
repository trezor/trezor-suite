import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type RetryButtonProps = {
    handleRetry: () => void;
};

export const RetryButton = ({ handleRetry }: RetryButtonProps) => (
    <Button
        intent="neutral"
        priority="secondary"
        onPress={handleRetry}
        testID="@device-compromised/retry-button"
    >
        <Translation id="generic.buttons.retry" />
    </Button>
);
