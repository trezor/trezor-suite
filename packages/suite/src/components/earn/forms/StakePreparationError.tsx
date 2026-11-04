import { Translation } from '@suite/intl';
import { Banner } from '@trezor/components';

type StakePreparationErrorProps = {
    onRetry: () => void;
};

export const StakePreparationError = ({ onRetry }: StakePreparationErrorProps) => (
    <Banner
        intent="critical"
        description={<Translation id="TR_STAKE_TX_PREPARATION_FAILED" />}
        rightContent={
            <Banner.Button onClick={() => onRetry()}>
                <Translation id="TR_RETRY" />
            </Banner.Button>
        }
    />
);
