import { useCallback, useMemo, useState } from 'react';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { selectIsPublic } from '@suite/coinjoin';
import { selectIsDebugModeActive } from '@suite/debug';
import { Translation } from '@suite/intl';
import { goto, selectRouterApp } from '@suite/router';
import { selectIsTestnetNetworksEnabled } from '@suite/settings';
import { useServices } from '@suite-common/dependency-injection';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type Network,
    type NetworkAccount,
    type NetworkSymbol,
    getNetwork,
    networks,
} from '@suite-common/wallet-config';
import {
    accountsActions,
    changeCoinVisibility,
    reportWalletBalanceThunk,
    selectAccounts,
    selectEnabledNetworks,
} from '@suite-common/wallet-core';
import { getAvailableAccountTypes, prepareNewAccountPayload } from '@suite-common/wallet-utils';
import { Column, Modal } from '@trezor/components';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { arrayPartition } from '@trezor/utils';

import { useAvailableNetworkSymbols } from 'src/components/wallet/WalletLayout/AccountsMenu/useAvailableNetworkSymbols';
import { useNetworkSupport } from 'src/hooks/settings/useNetworkSupport';
import { useAccountSearch, useDispatch, useSelector } from 'src/hooks/suite';
import { type TrezorDevice } from 'src/types/suite';
import { type Account } from 'src/types/wallet';

import { AccountTypeSelect } from './AccountTypeSelect/AccountTypeSelect';
import { AddAccountButton } from './AddAccountButton/AddAccountButton';
import { SelectNetwork } from './SelectNetwork';
import { verifyAvailability } from './verifyAvailability';
import { AdvancedCoinSettingsModal } from '../AdvancedCoinSettingsModal/AdvancedCoinSettingsModal';

type AddAccountProps = {
    device: TrezorDevice;
    onCancel: () => void;
    onConfirm?: () => void;
    symbol?: NetworkSymbol;
    noRedirect?: boolean;
    isCoinjoinDisabled?: boolean;
    isBackClickDisabled?: boolean;
    onAddAccount?: (account: Account) => void;
};

export const AddAccountModal = ({
    device,
    onCancel,
    onConfirm,
    symbol,
    noRedirect,
    onAddAccount,
    isCoinjoinDisabled,
    isBackClickDisabled,
}: AddAccountProps) => {
    const accounts = useSelector(selectAccounts);
    const app = useSelector(selectRouterApp);
    const isDebug = useSelector(selectIsDebugModeActive);
    const isCoinjoinPublic = useSelector(selectIsPublic);
    const enabledNetworkSymbols = useSelector(selectEnabledNetworks);
    const useTestnetNetworks = useSelector(selectIsTestnetNetworksEnabled);
    const dispatch = useDispatch();

    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const { setCoinFilter, setSearchString, coinFilter } = useAccountSearch();

    const resetAccountSearch = (symbol: NetworkSymbol) => {
        // reset search string in account search box so the new account is visible in the list
        setSearchString(undefined);
        if (coinFilter && !coinFilter.includes(symbol)) {
            // if coinFilter is active then reset it only if added account doesn't belong to selected/filtered coin
            setCoinFilter([]);
        }
    };

    const reportNewAccountAnalytics = (
        account: Pick<Account, 'accountType' | 'path' | 'symbol'>,
    ) => {
        analytics.report({
            type: events.accountsNewAccountEvent.name,
            payload: {
                type: account.accountType,
                path: account.path,
                symbol: account.symbol,
            },
        });
    };

    const { showUnsupportedCoins, supportedMainnets, unsupportedMainnets, supportedTestnets } =
        useNetworkSupport();

    const supportedNetworks = [...supportedMainnets, ...supportedTestnets];
    const allTestnetNetworksDisabled = !supportedTestnets.some(network =>
        enabledNetworkSymbols.includes(network.symbol),
    );
    const isBitcoinOnlyFirmware = hasBitcoinOnlyFirmware(device);

    // applied when changing account in trading exchange receive options context
    const networkPinned = !!symbol;
    const preselectedNetwork = symbol && supportedNetworks.find(n => n.symbol === symbol);
    // or in case of only btc is enabled on bitcoin-only firmware
    const bitcoinOnlyDefaultNetworkSelection =
        isBitcoinOnlyFirmware && supportedMainnets.length === 1 && allTestnetNetworksDisabled
            ? networks.btc
            : undefined;

    const isCoinjoinVisible = (isCoinjoinPublic || isDebug) && !isCoinjoinDisabled;

    const getAccountTypesForNetwork = useCallback(
        (network?: Network) => {
            if (!network || !enabledNetworkSymbols.includes(network.symbol)) {
                return undefined;
            }

            return getAvailableAccountTypes(network.symbol, {
                isCoinjoinVisible,
                isDebug,
            });
        },
        [enabledNetworkSymbols, isCoinjoinVisible, isDebug],
    );

    const defaultAccountTypeSelectionNetwork =
        preselectedNetwork || bitcoinOnlyDefaultNetworkSelection;
    const initialAccountTypeSelectionNetwork =
        defaultAccountTypeSelectionNetwork &&
        (getAccountTypesForNetwork(defaultAccountTypeSelectionNetwork)?.length ?? 0) > 1
            ? defaultAccountTypeSelectionNetwork
            : undefined;

    const [accountTypeSelectionNetwork, setAccountTypeSelectionNetwork] = useState<
        Network | undefined
    >(initialAccountTypeSelectionNetwork);
    const [selectedAccount, setSelectedAccount] = useState<NetworkAccount | undefined>(undefined);
    const [advancedSettingsSymbol, setAdvancedSettingsSymbol] = useState<
        NetworkSymbol | undefined
    >();

    const closeAdvancedSettings = () => setAdvancedSettingsSymbol(undefined);

    const availableNetworksSymbols = useAvailableNetworkSymbols();

    const enabledNetworks = availableNetworksSymbols.map(networkSymbol =>
        getNetwork(networkSymbol),
    );
    const [enabledMainnetNetworks, enabledTestnetNetworks] = useMemo(
        () => arrayPartition(enabledNetworks, network => !network?.testnet),
        [enabledNetworks],
    );
    const disabledNetworks = supportedNetworks.filter(
        network => !availableNetworksSymbols.includes(network.symbol),
    );

    const [disabledMainnetNetworks, disabledTestnetNetworks] = useMemo(
        () => arrayPartition(disabledNetworks, network => !network?.testnet),
        [disabledNetworks],
    );
    const testnetNetworks = useMemo(
        () => [...enabledTestnetNetworks, ...disabledTestnetNetworks],
        [enabledTestnetNetworks, disabledTestnetNetworks],
    );

    // Suite Dark flavour: the network search box is removed from the Add account modal
    // (Bitcoin-only build → tiny list), so the sections render the raw network lists.

    // Collect all empty accounts related to selected device and selected accountType
    const currentType = selectedAccount?.accountType ?? 'normal';
    const scopedAccounts = accountTypeSelectionNetwork
        ? accounts
              .filter(
                  a =>
                      a.deviceState === device.state?.staticSessionId &&
                      a.symbol === accountTypeSelectionNetwork.symbol &&
                      a.accountType === currentType,
              )
              .toSorted((a, b) => a.index - b.index)
        : [];
    const symbolPinnedEmptyAccounts = preselectedNetwork
        ? accounts
              .filter(
                  a =>
                      a.deviceState === device.state?.staticSessionId &&
                      a.symbol === preselectedNetwork.symbol &&
                      a.accountType === currentType,
              )
              .filter(a => a.empty)
        : [];

    const filterNetworksBySymbol = (items: Network[], networkSymbol?: NetworkSymbol) =>
        networkSymbol ? items.filter(network => network.symbol === networkSymbol) : items;

    const filteredDisabledNetworks = filterNetworksBySymbol(
        symbol ? disabledNetworks : disabledMainnetNetworks,
        symbol,
    );
    const filteredEnabledNetworks = filterNetworksBySymbol(enabledNetworks, symbol);

    const visibleNetworks =
        symbolPinnedEmptyAccounts.length > 0 ? filteredEnabledNetworks : filteredDisabledNetworks;

    const accountTypes = getAccountTypesForNetwork(accountTypeSelectionNetwork);

    // Mirrors the validation of the account-type-selection "Add" button for the inline
    // network-row buttons: disable + explain when an account can't be added (e.g. the
    // previous account is still empty, or the device lacks the capability).
    const getAddDisabledMessage = useCallback(
        (network: Network) => {
            // The inline button only adds an account directly for already-enabled networks
            // with a single account type. Disabled networks just get enabled and multi-type
            // networks open the account-type-selection step, so neither needs this guard.
            if (!enabledNetworkSymbols.includes(network.symbol)) return undefined;

            const networkAccountTypes = getAccountTypesForNetwork(network);
            if (!networkAccountTypes || networkAccountTypes.length > 1) return undefined;

            const defaultAccountTypeName = networkAccountTypes[0]?.accountType ?? 'normal';
            const networkScopedAccounts = accounts.filter(
                account =>
                    account.deviceState === device.state?.staticSessionId &&
                    account.symbol === network.symbol &&
                    account.accountType === defaultAccountTypeName,
            );
            const defaultAccount = networkScopedAccounts
                .toSorted((a, b) => a.index - b.index)
                .at(-1);
            const unavailableCapability = device.unavailableCapabilities?.[defaultAccountTypeName];

            const disabledMessage = verifyAvailability({
                emptyAccounts: networkScopedAccounts.filter(
                    account => account.empty && !account.visible,
                ),
                account: defaultAccount,
                unavailableCapability,
            });

            return disabledMessage ? <Translation id={disabledMessage} /> : undefined;
        },
        [
            accounts,
            device.state?.staticSessionId,
            device.unavailableCapabilities,
            enabledNetworkSymbols,
            getAccountTypesForNetwork,
        ],
    );

    function enableNetwork(network: Network) {
        onCancel();
        dispatch(changeCoinVisibility({ symbol: network.symbol, shouldBeVisible: true }));
        onConfirm?.();

        if (app === 'wallet' && !noRedirect) {
            // redirect to account only if added from "wallet" app
            dispatch(
                goto({
                    routeName: 'wallet-index',
                    params: {
                        symbol: network.symbol,
                        accountIndex: 0,
                        accountType: 'normal',
                    },
                }),
            );
        }
    }

    async function enableAccount(
        account: Account,
        {
            selectedAccount: nextSelectedAccount = selectedAccount,
            accountTypes: nextAccountTypes = accountTypes,
        }: {
            selectedAccount?: NetworkAccount;
            accountTypes?: NetworkAccount[];
        } = {},
    ) {
        onCancel();

        const finishEnableAccount = (addedAccount: Account) => {
            resetAccountSearch(addedAccount.symbol);
            reportNewAccountAnalytics(addedAccount);
            dispatch(reportWalletBalanceThunk());
            onConfirm?.();

            onAddAccount?.(addedAccount);
            if (app === 'wallet' && !noRedirect) {
                dispatch(
                    goto({
                        routeName: 'wallet-index',
                        params: {
                            symbol: addedAccount.symbol,
                            accountIndex: addedAccount.index,
                            accountType: addedAccount.accountType,
                        },
                    }),
                );
            }
        };

        if (!account.visible) {
            dispatch(accountsActions.changeAccountVisibility(account));
            finishEnableAccount(account);

            return;
        }

        const newAccount = await prepareNewAccountPayload({
            accountType: account.accountType,
            networkSymbol: account.symbol,
            index: account.index + 1,
            backendType: account.backendType != 'coinjoin' ? account.backendType : undefined,
            selectedAccount: nextSelectedAccount,
            accountTypes: nextAccountTypes,
            device,
        });

        if (newAccount instanceof Error) {
            dispatch(
                notificationsActions.addToast({
                    type: 'discovery-error',
                    error: newAccount.message,
                }),
            );

            return;
        }

        const createAccountAction = accountsActions.createAccount(newAccount);
        dispatch(createAccountAction);
        finishEnableAccount(createAccountAction.payload);
    }

    async function addNewAccount({
        network,
        account,
        accountTypes: nextAccountTypes,
    }: {
        network: Network;
        account: NetworkAccount;
        accountTypes: NetworkAccount[];
    }) {
        const newAccount = await prepareNewAccountPayload({
            accountType: account.accountType,
            networkSymbol: network.symbol,
            index: 0,
            backendType: account.backendType != 'coinjoin' ? account.backendType : undefined,
            selectedAccount: account,
            accountTypes: nextAccountTypes,
            device,
        });

        if (newAccount instanceof Error) {
            dispatch(
                notificationsActions.addToast({
                    type: 'discovery-error',
                    error: newAccount.message,
                }),
            );

            return;
        }

        onCancel();
        dispatch(accountsActions.createAccount(newAccount));
        resetAccountSearch(newAccount.symbol);
        reportNewAccountAnalytics(newAccount);
        dispatch(reportWalletBalanceThunk());
        onConfirm?.();
    }

    const handleNetworkSelection = async (networkSymbol?: NetworkSymbol) => {
        if (!networkSymbol) {
            setAccountTypeSelectionNetwork(undefined);

            return;
        }

        const networkToSelect = networks[networkSymbol];

        if (!networkToSelect) {
            return;
        }

        const networkAccountTypes = getAccountTypesForNetwork(networkToSelect);

        if (networkAccountTypes && networkAccountTypes.length > 1) {
            if (!networkPinned) {
                setAccountTypeSelectionNetwork(networkToSelect);
                setSelectedAccount(undefined);
            }

            return;
        }

        if (!enabledNetworkSymbols.includes(networkToSelect.symbol)) {
            enableNetwork(networkToSelect);

            return;
        }

        const defaultAccountType = networkAccountTypes?.[0];
        const defaultAccountTypeName = defaultAccountType?.accountType ?? 'normal';
        const nextScopedAccounts = accounts
            .filter(
                account =>
                    account.deviceState === device.state?.staticSessionId &&
                    account.symbol === networkToSelect.symbol &&
                    account.accountType === defaultAccountTypeName,
            )
            .toSorted((a, b) => a.index - b.index);
        const defaultAccount = nextScopedAccounts.at(-1);

        if (defaultAccount) {
            await enableAccount(defaultAccount, {
                selectedAccount: defaultAccountType,
                accountTypes: networkAccountTypes,
            });

            return;
        }

        if (!defaultAccountType || !networkAccountTypes) return;

        await addNewAccount({
            network: networkToSelect,
            account: defaultAccountType,
            accountTypes: networkAccountTypes,
        });
    };

    const isAccountTypeSelectionStep =
        !!accountTypeSelectionNetwork && !!accountTypes && accountTypes.length > 1;

    const getStepConfig = () => {
        const isAccountActivated =
            preselectedNetwork &&
            enabledNetworks.some(enabledNetwork => enabledNetwork.symbol === symbol);

        return isAccountTypeSelectionStep
            ? {
                  heading: (
                      <Translation
                          id="TR_ADD_NETWORK_ACCOUNT"
                          values={{
                              network: accountTypeSelectionNetwork.name,
                          }}
                      />
                  ),
                  children: (
                      <AccountTypeSelect
                          selectedAccountType={selectedAccount}
                          accountTypes={accountTypes}
                          onSelectAccountType={setSelectedAccount}
                          networkType={accountTypeSelectionNetwork.networkType}
                          symbol={accountTypeSelectionNetwork.symbol}
                      />
                  ),
                  onBackClick: !isBackClickDisabled
                      ? () => setAccountTypeSelectionNetwork(undefined)
                      : undefined,
                  bottomContent: (
                      <AddAccountButton
                          network={accountTypeSelectionNetwork}
                          selectedAccount={selectedAccount}
                          scopedAccounts={scopedAccounts}
                          onEnableAccount={account => {
                              void enableAccount(account, {
                                  selectedAccount,
                                  accountTypes,
                              });
                          }}
                          onAddNewAccount={() => {
                              const account = selectedAccount ?? accountTypes[0];

                              if (!account) return;

                              void addNewAccount({
                                  network: accountTypeSelectionNetwork,
                                  account,
                                  accountTypes,
                              });
                          }}
                      />
                  ),
              }
            : {
                  heading: <Translation id="TR_ADD_ACCOUNT" />,
                  children: symbol ? (
                      <Column gap={24}>
                          <SelectNetwork
                              heading={
                                  isAccountActivated ? (
                                      <Translation id="TR_ACTIVATED_COINS" />
                                  ) : (
                                      <Translation id="TR_INACTIVE_COINS" />
                                  )
                              }
                              networks={visibleNetworks}
                              handleNetworkSelection={handleNetworkSelection}
                              onSettings={setAdvancedSettingsSymbol}
                              getAddDisabledMessage={getAddDisabledMessage}
                          />
                      </Column>
                  ) : (
                      <Column gap={24}>
                          <SelectNetwork
                              heading={<Translation id="TR_ACTIVATED_COINS" />}
                              networks={enabledMainnetNetworks}
                              handleNetworkSelection={handleNetworkSelection}
                              onSettings={setAdvancedSettingsSymbol}
                              getAddDisabledMessage={getAddDisabledMessage}
                          />
                          <SelectNetwork
                              heading={<Translation id="TR_INACTIVE_COINS" />}
                              networks={disabledMainnetNetworks}
                              handleNetworkSelection={handleNetworkSelection}
                              onSettings={setAdvancedSettingsSymbol}
                              getAddDisabledMessage={getAddDisabledMessage}
                          />
                          {useTestnetNetworks && testnetNetworks.length > 0 && (
                              <SelectNetwork
                                  heading={<Translation id="TR_TESTNET_COINS" />}
                                  data-testid="@modal/account/activate_more_coins"
                                  networks={testnetNetworks}
                                  handleNetworkSelection={handleNetworkSelection}
                                  onSettings={setAdvancedSettingsSymbol}
                                  getAddDisabledMessage={getAddDisabledMessage}
                              />
                          )}
                          {showUnsupportedCoins && unsupportedMainnets.length > 0 && (
                              <SelectNetwork
                                  heading={<Translation id="TR_UNSUPPORTED_COINS" />}
                                  data-testid="@modal/account/activate_more_coins"
                                  networks={unsupportedMainnets}
                                  onSettings={setAdvancedSettingsSymbol}
                              />
                          )}
                      </Column>
                  ),
              };
    };

    if (advancedSettingsSymbol) {
        return (
            <AdvancedCoinSettingsModal
                symbol={advancedSettingsSymbol}
                onCancel={closeAdvancedSettings}
                onBackClick={closeAdvancedSettings}
            />
        );
    }

    return <Modal onCancel={onCancel} width={600} {...getStepConfig()} />;
};
