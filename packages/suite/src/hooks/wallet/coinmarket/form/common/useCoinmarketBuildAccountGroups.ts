import { selectAccounts, selectDevice } from '@suite-common/wallet-core';
import { useMemo } from 'react';
import { useAccountLabel } from 'src/components/suite/AccountLabel';
import { useSelector } from 'src/hooks/suite';
import { selectAccountLabels } from 'src/reducers/suite/metadataReducer';
import {
    CoinmarketAccountsOptionsGroupProps,
    CoinmarketTradeSellExchangeType,
} from 'src/types/coinmarket/coinmarket';
import { coinmarketBuildAccountOptions } from 'src/utils/wallet/coinmarket/coinmarketUtils';

export const useCoinmarketBuildAccountGroups = (
    type: CoinmarketTradeSellExchangeType,
): CoinmarketAccountsOptionsGroupProps[] => {
    const accounts = useSelector(selectAccounts);
    const accountLabels = useSelector(selectAccountLabels);
    const device = useSelector(selectDevice);
    const { defaultAccountLabelString } = useAccountLabel();
    const { tokenDefinitions } = useSelector(state => state);
    const supportedSymbols = useSelector(state =>
        type === 'sell'
            ? state.wallet.coinmarket.sell.sellInfo?.supportedCryptoCurrencies
            : state.wallet.coinmarket.exchange.exchangeInfo?.sellSymbols,
    );

    const accountsMemo = useMemo(() => accounts, [accounts]);
    const accountLabelsMemo = useMemo(() => accountLabels, [accountLabels]);
    const deviceStateMemo = useMemo(() => device?.state, [device?.state]);
    const supportedSymbolsMemo = useMemo(() => supportedSymbols, [supportedSymbols]);
    const tokenDefinitionsMemo = useMemo(() => tokenDefinitions, [tokenDefinitions]);

    const groups = useMemo(
        () =>
            coinmarketBuildAccountOptions({
                accounts: accountsMemo,
                deviceState: deviceStateMemo,
                accountLabels: accountLabelsMemo,
                tokenDefinitions: tokenDefinitionsMemo,
                supportedCryptoIds: supportedSymbolsMemo,
                defaultAccountLabelString,
            }),

        [
            accountsMemo,
            supportedSymbolsMemo,
            accountLabelsMemo,
            deviceStateMemo,
            tokenDefinitionsMemo,
            defaultAccountLabelString,
        ],
    );

    return groups;
};
