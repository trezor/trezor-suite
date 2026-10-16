import { PORTFOLIO_TRACKER_DEVICE_STATE } from '@suite-common/device';
import { type NetworksRootState, selectSupportedNetworkSymbols } from '@suite-common/networks';
import {
    type GetTokenDefinitionsEnabledNetworksDep,
    type TokenDefinitionsRootState,
    getSupportedDefinitionTypes,
    getTokenDefinitionThunk,
    periodicCheckTokenDefinitionsThunk,
    selectNetworkTokenDefinitions,
} from '@suite-common/token-definitions';
import { type AccountType, type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type BlockchainRootState,
    accountsActions,
    selectAccountsByNetworkAndDeviceState,
    selectNetworkBlockchainInfo,
} from '@suite-common/wallet-core';
import {
    getAccountIdentity,
    getBackendFromSettings,
    shouldUseIdentities,
} from '@suite-common/wallet-utils';
import { isNetworkWithTokens } from '@suite-native/tokens';
import TrezorConnect, { type AccountInfo } from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';
import type { Bip43Path } from '@trezor/crypto-utils';
import { type WithServices, createThunk } from '@trezor/redux-utils';
import { convertTaprootXpub } from '@trezor/utils';
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

// Only discovery reports which backend serves an account. An imported one takes the backend the
// network is configured with, so a direct-RPC account is refreshed and paged like a discovered one.
const getImportedAccountBackendType = (state: BlockchainRootState, symbol: NetworkSymbol) => {
    const { type } = getBackendFromSettings(
        symbol,
        selectNetworkBlockchainInfo(state, symbol)?.backends,
    );

    return type === 'coinjoin' ? undefined : type;
};

export type ImportAccountThunkState = AccountsRootState &
    BlockchainRootState &
    TokenDefinitionsRootState &
    NetworksRootState;

export type ImportAccountThunkDeps = WithServices<GetTokenDefinitionsEnabledNetworksDep>;

export const importAccountThunk = createThunk<
    void,
    ImportAssetThunkPayload,
    { state: ImportAccountThunkState; extra: ImportAccountThunkDeps }
>(
    `${ACCOUNTS_IMPORT_MODULE_PREFIX}/importAccountThunk`,
    ({ accountInfo, accountLabel, symbol }, { dispatch, getState }) => {
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
            dispatch(
                accountsActions.updateAccount(
                    {
                        ...existingAccount,
                        backendType: getImportedAccountBackendType(getState(), symbol),
                    },
                    accountInfo,
                ),
            );
        } else {
            const accountType = getAccountTypeFromDescriptor(accountInfo.descriptor, symbol);
            const imported = true;
            dispatch(
                accountsActions.createAccount(
                    {
                        deviceState,
                        index: deviceNetworkAccounts.length, // indexed from 0
                        path: (accountInfo?.path ?? '') as Bip43Path,
                        accountType,
                        symbol,
                        backendType: getImportedAccountBackendType(getState(), symbol),
                        accountInfo,
                        imported,
                        accountLabel,
                        visible: true,
                    },
                    selectSupportedNetworkSymbols(getState()),
                ),
            );
        }
        dispatch(periodicCheckTokenDefinitionsThunk());
    },
);

type GetAccountInfoThunkState = TokenDefinitionsRootState;

// Fiat rates of the imported account are not fetched here, the screens showing them subscribe.
export const getAccountInfoThunk = createThunk<
    AccountInfo,
    { symbol: NetworkSymbol; xpubAddress: string },
    { rejectValue: string; state: GetAccountInfoThunkState }
>(
    `${ACCOUNTS_IMPORT_MODULE_PREFIX}/getAccountInfo`,
    async ({ symbol, xpubAddress }, { dispatch, rejectWithValue, getState }) => {
        // Connect requires apostrophe in Taproot descriptors thus a conversion is necessary.
        const taprootXpubWithApostrophes = convertTaprootXpub({
            xpub: xpubAddress,
            direction: 'h-to-apostrophe',
        });

        try {
            const fetchedAccountInfo = await TrezorConnect.getAccountInfo({
                coin: asCoinSymbol(symbol),
                identity: shouldUseIdentities(symbol)
                    ? getAccountIdentity({
                          deviceState: PORTFOLIO_TRACKER_DEVICE_STATE,
                      })
                    : undefined,
                descriptor: taprootXpubWithApostrophes ?? xpubAddress,
                details: 'txs',
                suppressBackupWarning: true,
                protocols: getNetworkType(symbol) === 'ethereum' ? ['erc4626'] : undefined,
            });

            if (fetchedAccountInfo?.success) {
                const tokenDefinitions = selectNetworkTokenDefinitions(getState(), symbol);

                // fetch token definitions for this network in case they are needed
                if (!tokenDefinitions && isNetworkWithTokens(symbol)) {
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

                return fetchedAccountInfo.payload;
            } else {
                return rejectWithValue(fetchedAccountInfo.error.message);
            }
        } catch (error) {
            return rejectWithValue(error?.message);
        }
    },
);
