import { BannerInline } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type TransactionDetailErrorProps = {
    onRetry: () => void;
};

export const TransactionDetailError = ({ onRetry }: TransactionDetailErrorProps) => (
    <BannerInline
        intent="critical"
        title={<Translation id="generic.unknownError" />}
        buttonLabel={<Translation id="generic.buttons.tryAgain" />}
        onButtonPress={onRetry}
    />
);
