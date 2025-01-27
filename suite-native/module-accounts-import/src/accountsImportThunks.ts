import { createThunk } from '@suite-common/redux-utils';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import {
    getSupportedDefinitionTypes,
    getTokenDefinitionThunk,
    periodicCheckTokenDefinitionsThunk,
    selectFilterKnownTokens,
    selectNetworkTokenDefinitions,
} from '@suite-common/token-definitions';
import {
    type AccountType,
    type Bip43Path,
    type NetworkSymbol,
    getNetworkType,
} from '@suite-common/wallet-config';
import {
    PORTFOLIO_TRACKER_DEVICE_STATE,
    accountsActions,
    selectAccountsByNetworkAndDeviceState,
    updateFiatRatesThunk,
} from '@suite-common/wallet-core';
import { Timestamp, TokenAddress } from '@suite-common/wallet-types';
import { getAccountIdentity, shouldUseIdentities } from '@suite-common/wallet-utils';
import { isCoinWithTokens } from '@suite-native/tokens';
import TrezorConnect, { AccountInfo } from '@trezor/connect';
import { getXpubOrDescriptorInfo } from '@trezor/utxo-lib';

import { paymentTypeToAccountType } from './constants';

const ACCOUNTS_IMPORT_MODULE_PREFIX = '@suite-native/accountsImport';

type ImportAssetThunkPayload = {
    accountInfo: AccountInfo;
    accountLabel: string;
    symbol: NetworkSymbol;
};

const getAccountTypeFromDescriptor = (descriptor: string, symbol: NetworkSymbol): AccountType => {
    // account type supported only for btc and ltc
    if (symbol !== 'btc' && symbol !== 'ltc' && symbol !== 'test') return 'imported';
    const { paymentType } = getXpubOrDescriptorInfo(descriptor);

    return paymentTypeToAccountType[paymentType];
};

export const importAccountThunk = createThunk(
    `${ACCOUNTS_IMPORT_MODULE_PREFIX}/importAccountThunk`,
    ({ accountInfo, accountLabel, symbol }: ImportAssetThunkPayload, { dispatch, getState }) => {
        const deviceState = PORTFOLIO_TRACKER_DEVICE_STATE;

        const deviceNetworkAccounts = selectAccountsByNetworkAndDeviceState(
            getState(),
            deviceState,
            symbol,
        );
        const existingAccount = deviceNetworkAccounts.find(
            account => account.descriptor === accountInfo.descriptor,
        );

        if (existingAccount) {
            dispatch(accountsActions.updateAccount(existingAccount, accountInfo));
        } else {
            const accountType = getAccountTypeFromDescriptor(accountInfo.descriptor, symbol);
            const imported = true;
            dispatch(
                accountsActions.createAccount({
                    deviceState,
                    discoveryItem: {
                        index: deviceNetworkAccounts.length, // indexed from 0
                        path: (accountInfo?.path ?? '') as Bip43Path,
                        accountType,
                        networkType: getNetworkType(symbol),
                        coin: symbol,
                    },
                    accountInfo,
                    imported,
                    accountLabel,
                    visible: true,
                }),
            );
        }
        dispatch(periodicCheckTokenDefinitionsThunk());
    },
);

export const getAccountInfoThunk = createThunk<
    AccountInfo,
    { symbol: NetworkSymbol; fiatCurrency: FiatCurrencyCode; xpubAddress: string },
    { rejectValue: string }
>(
    `${ACCOUNTS_IMPORT_MODULE_PREFIX}/getAccountInfo`,
    async ({ symbol, fiatCurrency, xpubAddress }, { dispatch, rejectWithValue, getState }) => {
        try {
            const [fetchedAccountInfo] = await Promise.all([
                TrezorConnect.getAccountInfo({
                    coin: symbol,
                    identity: shouldUseIdentities(symbol)
                        ? getAccountIdentity({
                              deviceState: PORTFOLIO_TRACKER_DEVICE_STATE,
                          })
                        : undefined,
                    descriptor: xpubAddress,
                    details: 'txs',
                    suppressBackupWarning: true,
                }),
                dispatch(
                    updateFiatRatesThunk({
                        tickers: [
                            {
                                symbol,
                            },
                        ],
                        rateType: 'current',
                        localCurrency: fiatCurrency,
                        fetchAttemptTimestamp: Date.now() as Timestamp,
                    }),
                ),
            ]);

            if (fetchedAccountInfo?.success) {
                const tokenDefinitions = selectNetworkTokenDefinitions(getState(), symbol);

                // fetch token definitions for this network in case they are needed
                if (!tokenDefinitions && isCoinWithTokens(symbol)) {
                    const definitionTypes = getSupportedDefinitionTypes(symbol);

                    const promises = definitionTypes.map(async type => {
                        await dispatch(
                            getTokenDefinitionThunk({
                                symbol,
                                type,
                            }),
                        );
                    });
                    await Promise.all(promises);
                }
                // fetch fiat rates for all tokens of newly discovered account
                // Even that there is check in updateFiatRatesThunk, it is better to do it here and do not dispatch thunk at all because it has some overhead and sometimes there could be lot of tokens
                const knownTokens = selectFilterKnownTokens(
                    getState(),
                    symbol,
                    fetchedAccountInfo.payload.tokens ?? [],
                );

                const tickers = knownTokens.map(token => ({
                    symbol,
                    tokenAddress: token.contract as TokenAddress,
                }));

                dispatch(
                    updateFiatRatesThunk({
                        tickers,
                        rateType: 'current',
                        localCurrency: fiatCurrency,
                        fetchAttemptTimestamp: Date.now() as Timestamp,
                    }),
                );

                return fetchedAccountInfo.payload;
            } else {
                return rejectWithValue(fetchedAccountInfo.payload.error);
            }
        } catch (error) {
            return rejectWithValue(error?.message);
        }
    },
);
