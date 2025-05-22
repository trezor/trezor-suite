import { useMemo } from 'react';

import { selectSelectedDevice } from '@suite-common/device';
import { type TradingType, selectTradingSupportedSymbols } from '@suite-common/trading';
import { selectAccounts } from '@suite-common/wallet-blockchain';

import { useDefaultAccountLabel, useSelector } from 'src/hooks/suite';
import { selectAccountLabels } from 'src/reducers/suite/metadataReducer';
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
    const supportedSymbols = useSelector(state => selectTradingSupportedSymbols(state, type));

    const groups = useMemo(
        () =>
            tradingBuildAccountOptions({
                accounts,
                deviceState: device?.state?.staticSessionId,
                accountLabels,
                tokenDefinitions,
                supportedCryptoIds: new Set(supportedSymbols),
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
