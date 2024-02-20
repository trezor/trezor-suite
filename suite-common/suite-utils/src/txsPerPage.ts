import { settingsCommonConfig } from '@suite-common/suite-config';
import type { Account } from '@suite-common/wallet-types';

export const getTxsPerPage = (networkType: Account['networkType']) => {
    if (networkType === 'solana') {
        return 5;
    }

    return settingsCommonConfig.TXS_PER_PAGE;
};
