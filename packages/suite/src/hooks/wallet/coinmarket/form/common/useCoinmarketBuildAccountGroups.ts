import { useMemo } from 'react';

import { selectAccounts, selectDevice } from '@suite-common/wallet-core';

import { useDefaultAccountLabel, useSelector } from 'src/hooks/suite';
import { selectAccountLabels } from 'src/reducers/suite/metadataReducer';
import { selectSupportedSymbols } from 'src/reducers/wallet/coinmarketReducer';
import {
    CoinmarketAccountsOptionsGroupProps,
    CoinmarketTradeType,
} from 'src/types/coinmarket/coinmarket';
import { coinmarketBuildAccountOptions } from 'src/utils/wallet/coinmarket/coinmarketUtils';

export const useCoinmarketBuildAccountGroups = (
    type: CoinmarketTradeType,
): CoinmarketAccountsOptionsGroupProps[] => {
    const accounts = useSelector(selectAccounts);
    const accountLabels = useSelector(selectAccountLabels);
    const device = useSelector(selectDevice);
    const { getDefaultAccountLabel } = useDefaultAccountLabel();
    const { tokenDefinitions } = useSelector(state => state);
    const supportedSymbols = useSelector(selectSupportedSymbols(type));

    const groups = useMemo(
        () =>
            coinmarketBuildAccountOptions({
                accounts,
                deviceState: device?.state?.staticSessionId,
                accountLabels,
                tokenDefinitions,
                supportedCryptoIds: supportedSymbols,
                getDefaultAccountLabel,
            }),

        [
            accounts,
            device?.state?.staticSessionId,
            accountLabels,
            tokenDefinitions,
            supportedSymbols,
            getDefaultAccountLabel,
        ],
    );

    return groups;
};
