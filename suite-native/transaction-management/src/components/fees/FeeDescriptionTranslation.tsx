import type { NetworkType } from '@suite-common/wallet-config';
import { Translation } from '@suite-native/intl';

export type FeeDescriptionTranslationProps = {
    networkType: NetworkType;
};

export const FeeDescriptionTranslation = ({ networkType }: FeeDescriptionTranslationProps) => {
    if (networkType === 'ripple') {
        return <Translation id="transactionManagement.fees.description.bodyRipple" />;
    }

    return <Translation id="transactionManagement.fees.description.body" />;
};
