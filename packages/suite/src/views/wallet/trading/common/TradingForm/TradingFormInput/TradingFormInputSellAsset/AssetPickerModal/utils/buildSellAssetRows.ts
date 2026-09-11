import { type TokenDefinitionsState } from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type RatesByKey } from '@suite-common/wallet-types';
import { filterAccountsByNetworkSymbol, isTestnet } from '@suite-common/wallet-utils';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

import {
    type AccountWithOptionalLabel,
    type AssetRowOption,
} from 'src/components/suite/asset-picker/types';
import { createAccountOption, createTokenOption } from 'src/components/suite/asset-picker/utils';
import {
    enhanceTokensWithRates,
    getTokens,
    sortTokensWithRates,
} from 'src/utils/wallet/tokenUtils';

export type BuildSellAssetRowsProps = {
    accounts: readonly AccountWithOptionalLabel[];
    supportedNetworks: readonly NetworkSymbol[];
    networkSymbolFilter: NetworkSymbol | undefined;
    tokenDefinitions: TokenDefinitionsState | undefined;
    baseCurrencyCode: BaseCurrencyCode;
    fiatRates: RatesByKey;
};

export const buildSellAssetRows = ({
    accounts,
    supportedNetworks,
    networkSymbolFilter,
    tokenDefinitions,
    baseCurrencyCode,
    fiatRates,
}: BuildSellAssetRowsProps): { assetRows: AssetRowOption[]; networks: NetworkSymbol[] } => {
    const getTokensWithBalance = (account: AccountWithOptionalLabel) => {
        const { shownWithBalance, hiddenWithBalance } = getTokens({
            tokens: account.tokens ?? [],
            symbol: account.symbol,
            tokenDefinitions: tokenDefinitions?.[account.symbol]?.coin,
        });

        return shownWithBalance.concat(hiddenWithBalance);
    };

    const validAccounts = accounts.filter(account => {
        if (isTestnet(account.symbol) || account.accountType === 'coinjoin') {
            return false;
        }

        return new BigNumber(account.balance).gt(0) || getTokensWithBalance(account).length > 0;
    });

    const networksInList = new Set(validAccounts.map(account => account.symbol));
    const networks = supportedNetworks.filter(symbol => networksInList.has(symbol));

    const assetRows: AssetRowOption[] = [];

    for (const account of filterAccountsByNetworkSymbol(validAccounts, networkSymbolFilter)) {
        if (new BigNumber(account.balance).gt(0)) {
            assetRows.push(createAccountOption(account));
        }

        enhanceTokensWithRates(
            getTokensWithBalance(account),
            baseCurrencyCode,
            account.symbol,
            fiatRates,
        )
            .sort(sortTokensWithRates)
            .forEach(token => {
                assetRows.push(createTokenOption(account, token));
            });
    }

    return { assetRows, networks };
};
