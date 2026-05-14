import type { NetworkType } from '@suite-common/wallet-config';
import { Translation } from '@suite-native/intl';

export type FeeLabelTranslationProps = {
    networkType: NetworkType;
    supportsAdjustableFees?: boolean;
};

export const FeeLabelTranslation = ({
    networkType,
    supportsAdjustableFees,
}: FeeLabelTranslationProps) => {
    if (networkType === 'ethereum' || (networkType === 'tron' && supportsAdjustableFees)) {
        return <Translation id="transactionManagement.fees.description.title.ethereum" />;
    }

    if (networkType === 'tron') {
        return <Translation id="transactionManagement.fees.description.title.tron" />;
    }

    return <Translation id="transactionManagement.fees.description.title.general" />;
};
