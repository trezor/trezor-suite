import type { NetworkType } from '@suite-common/wallet-config';
import { Translation } from '@suite-native/intl';

export type FeeLabelTranslationProps = {
    networkType: NetworkType;
};

export const FeeLabelTranslation = ({ networkType }: FeeLabelTranslationProps) => {
    if (networkType === 'ethereum') {
        return <Translation id="transactionManagement.fees.description.title.ethereum" />;
    }

    return <Translation id="transactionManagement.fees.description.title.general" />;
};
