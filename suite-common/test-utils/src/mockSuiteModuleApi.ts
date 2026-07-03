import type { SuiteModuleApi } from '@network-module/suite-types';

export const mockSuiteModuleApi: SuiteModuleApi = {
    getAreSatsAmountUnit: () => false,
    getBlockchainBlockInfoBySymbol: () => ({
        blockhash: '',
        blockHeight: 0,
    }),
    getIsApprovalFlowSupported: () => false,
    getSelectedDevice: () => undefined,
    addToast: () => {},
};
