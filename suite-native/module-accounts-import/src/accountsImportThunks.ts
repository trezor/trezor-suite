import { createThunk } from '@suite-common/redux-utils';
import {
    accountsActions,
    PORTFOLIO_TRACKER_DEVICE_STATE,
    selectAccountsByNetworkAndDeviceState,
    updateFiatRatesThunk,
} from '@suite-common/wallet-core';
import TrezorConnect, { AccountInfo } from '@trezor/connect';
import { networks, NetworkSymbol, AccountType } from '@suite-common/wallet-config';
import { getXpubOrDescriptorInfo } from '@trezor/utxo-lib';
import { getAccountIdentity, shouldUseIdentities } from '@suite-common/wallet-utils';
import { Timestamp, TokenAddress } from '@suite-common/wallet-types';
import { FiatCurrencyCode } from '@suite-common/suite-config';

import { paymentTypeToAccountType } from './constants';

const ACCOUNTS_IMPORT_MODULE_PREFIX = '@suite-native/accountsImport';

type ImportAssetThunkPayload = {
    accountInfo: AccountInfo;
    accountLabel: string;
    coin: NetworkSymbol;
};

const getAccountTypeFromDescriptor = (
    descriptor: string,
    networkSymbol: NetworkSymbol,
): AccountType => {
    // account type supported only for btc and ltc
    if (networkSymbol !== 'btc' && networkSymbol !== 'ltc' && networkSymbol !== 'test')
        return 'imported';
    const { paymentType } = getXpubOrDescriptorInfo(descriptor);

    return paymentTypeToAccountType[paymentType];
};

export const importAccountThunk = createThunk(
    `${ACCOUNTS_IMPORT_MODULE_PREFIX}/importAccountThunk`,
    ({ accountInfo, accountLabel, coin }: ImportAssetThunkPayload, { dispatch, getState }) => {
        const deviceState = PORTFOLIO_TRACKER_DEVICE_STATE;

        const deviceNetworkAccounts = selectAccountsByNetworkAndDeviceState(
            getState(),
            deviceState,
            coin,
        );
        const existingAccount = deviceNetworkAccounts.find(
            account => account.descriptor === accountInfo.descriptor,
        );

        if (existingAccount) {
            dispatch(accountsActions.updateAccount(existingAccount, accountInfo));
        } else {
            const accountType = getAccountTypeFromDescriptor(accountInfo.descriptor, coin);
            const imported = true;
            dispatch(
                accountsActions.createAccount({
                    deviceState,
                    discoveryItem: {
                        index: deviceNetworkAccounts.length, // indexed from 0
                        path: accountInfo?.path ?? '',
                        accountType,
                        networkType: networks[coin].networkType,
                        coin,
                    },
                    accountInfo,
                    imported,
                    accountLabel,
                    visible: true,
                }),
            );
        }
    },
);

export const getAccountInfoThunk = createThunk<
    AccountInfo,
    { networkSymbol: NetworkSymbol; fiatCurrency: FiatCurrencyCode; xpubAddress: string },
    { rejectValue: string }
>(
    `${ACCOUNTS_IMPORT_MODULE_PREFIX}/getAccountInfo`,
    async ({ networkSymbol, fiatCurrency, xpubAddress }, { dispatch, rejectWithValue }) => {
        try {
            const [fetchedAccountInfo] = await Promise.all([
                TrezorConnect.getAccountInfo({
                    coin: networkSymbol,
                    identity: shouldUseIdentities(networkSymbol)
                        ? getAccountIdentity({ deviceState: PORTFOLIO_TRACKER_DEVICE_STATE })
                        : undefined,
                    descriptor: xpubAddress,
                    details: 'txs',
                    suppressBackupWarning: true,
                }),
                dispatch(
                    updateFiatRatesThunk({
                        ticker: {
                            symbol: networkSymbol,
                        },
                        rateType: 'current',
                        localCurrency: fiatCurrency,
                        fetchAttemptTimestamp: Date.now() as Timestamp,
                    }),
                ),
            ]);

            if (fetchedAccountInfo?.success) {
                //fetch fiat rates for all tokens of newly discovered account
                fetchedAccountInfo.payload.tokens?.forEach(token =>
                    dispatch(
                        updateFiatRatesThunk({
                            ticker: {
                                symbol: networkSymbol,
                                tokenAddress: token.contract as TokenAddress,
                            },
                            rateType: 'current',
                            localCurrency: fiatCurrency,
                            fetchAttemptTimestamp: Date.now() as Timestamp,
                        }),
                    ),
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
