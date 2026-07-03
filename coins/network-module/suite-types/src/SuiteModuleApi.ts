export type GetAreSatsAmountUnitDep = {
    getAreSatsAmountUnit: () => boolean;
};

export type GetBlockchainBlockInfoBySymbolDep = {
    getBlockchainBlockInfoBySymbol: (symbol: string) => {
        blockhash: string;
        blockHeight: number;
    };
};

export type GetIsApprovalFlowSupportedDep = {
    getIsApprovalFlowSupported: () => boolean;
};

export type GetSelectedDeviceDep = {
    getSelectedDevice: () =>
        | {
              unavailableCapabilities?: {
                  amountUnit?: unknown;
              };
          }
        | undefined;
};

export type AddToastDep = {
    addToast: (
        payload: { type: 'sign-tx-error'; error: string } | { type: 'estimated-fee-error' },
    ) => void;
};

export type SuiteModuleApi = AddToastDep &
    GetAreSatsAmountUnitDep &
    GetBlockchainBlockInfoBySymbolDep &
    GetIsApprovalFlowSupportedDep &
    GetSelectedDeviceDep;

export type SuiteModuleApiDep = {
    suiteModuleApi: SuiteModuleApi;
};
