import { BannerInline } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { type FeeSelectorError } from '../../hooks/fees/useFeeSelector';

type FeeSelectorErrorBannerProps = {
    error: FeeSelectorError;
};

export const FeeSelectorErrorBanner = ({ error }: FeeSelectorErrorBannerProps) => {
    if (error.type === 'network-fee-fetch-error') {
        return (
            <BannerInline
                intent="critical"
                title={<Translation id="transactionManagement.fees.unavailable" />}
                buttonLabel={<Translation id="generic.buttons.retry" />}
                onButtonPress={error.retryNetworkFeeFetch}
            />
        );
    }

    return <BannerInline intent="critical" title={error.title} />;
};
