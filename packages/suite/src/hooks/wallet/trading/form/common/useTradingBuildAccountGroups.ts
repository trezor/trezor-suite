import { useMemo } from 'react';

import { CryptoId } from 'invity-api';

import { type TradingType, selectTradingSupportedSymbols } from '@suite-common/trading';
import { selectAccounts, selectSelectedDevice } from '@suite-common/wallet-core';

import { useDefaultAccountLabel, useSelector } from 'src/hooks/suite';
import { selectAccountLabels } from 'src/reducers/suite/metadataReducer';
import { TradingAccountsOptionsGroupProps } from 'src/types/trading/trading';
import { tradingBuildAccountOptions } from 'src/utils/wallet/trading/tradingUtils';

export const useTradingBuildAccountGroups = (
    type: TradingType,
    excludeCryptoId?: CryptoId,
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
                excludeCryptoId,
            }),

        [
            accounts,
            device?.state?.staticSessionId,
            accountLabels,
            tokenDefinitions,
            supportedSymbols,
            getDefaultAccountLabel,
            excludeCryptoId,
        ],
    );

    return groups;
};
