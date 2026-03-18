import type { NetworkType } from '@suite-common/wallet-config';

export const getFeeLabelTranslationId = (networkType: NetworkType) => {
    switch (networkType) {
        case 'ethereum':
            return 'transactionManagement.fees.description.title.ethereum' as const;
        default:
            return 'transactionManagement.fees.description.title.general' as const;
    }
};
