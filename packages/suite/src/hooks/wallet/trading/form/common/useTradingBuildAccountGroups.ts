import { useMemo } from 'react';

import { selectAccounts, selectSelectedDevice } from '@suite-common/wallet-core';
import type { TradingType } from '@suite-common/invity';

import { useDefaultAccountLabel, useSelector } from 'src/hooks/suite';
import { selectAccountLabels } from 'src/reducers/suite/metadataReducer';
import { selectSupportedSymbols } from 'src/reducers/wallet/tradingReducer';
import { TradingAccountsOptionsGroupProps } from 'src/types/trading/trading';
import { tradingBuildAccountOptions } from 'src/utils/wallet/trading/tradingUtils';

export const useTradingBuildAccountGroups = (
    type: TradingType,
): TradingAccountsOptionsGroupProps[] => {
    const accounts = useSelector(selectAccounts);
    const accountLabels = useSelector(selectAccountLabels);
    const device = useSelector(selectSelectedDevice);
    const { getDefaultAccountLabel } = useDefaultAccountLabel();
    const tokenDefinitions = useSelector(state => state.tokenDefinitions);
    const supportedSymbols = useSelector(selectSupportedSymbols(type));

    const groups = useMemo(
        () =>
            tradingBuildAccountOptions({
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
