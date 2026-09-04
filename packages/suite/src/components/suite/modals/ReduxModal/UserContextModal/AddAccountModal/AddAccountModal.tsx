import { useCallback, useMemo, useRef, useState } from 'react';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { selectIsPublic } from '@suite/coinjoin';
import { selectIsDebugModeActive } from '@suite/debug';
import { Translation } from '@suite/intl';
import { preserveModal } from '@suite/modal';
import { selectIsTestnetNetworksEnabled } from '@suite/settings';
import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type Network,
    type NetworkAccount,
    type NetworkSymbol,
    getNetwork,
} from '@suite-common/wallet-config';
import {
    accountsActions,
    changeCoinVisibilityThunk,
    reportWalletBalanceThunk,
    selectAccounts,
    selectEnabledNetworks,
} from '@suite-common/wallet-core';
import { getAvailableAccountTypes, prepareNewAccountPayload } from '@suite-common/wallet-utils';
import { Box, Column, Icon, Modal, Tooltip } from '@trezor/components';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { InfoIcon } from '@trezor/icons';
import { asNetworkSymbol } from '@trezor/network-module';

import { AddAccountBannerAboutNetworks } from 'src/components/suite/modals/ReduxModal/UserContextModal/AddAccountModal/AddAccountBannerAboutNetworks';
import { useAvailableNetworkSymbols } from 'src/components/wallet/WalletLayout/AccountsMenu/useAvailableNetworkSymbols';
import { useNetworkSupport } from 'src/hooks/settings/useNetworkSupport';
import { useAccountSearch, useSelector } from 'src/hooks/suite';
import { type TrezorDevice } from 'src/types/suite';
import { type Account } from 'src/types/wallet';
import { NetworkSettingsSearchInput } from 'src/views/settings/SettingsCoins/NetworkSettingsSearchInput';
import { NoNetworkSearchResults } from 'src/views/settings/SettingsCoins/NoNetworkSearchResults';
import { useNetworkSettingsSearch } from 'src/views/settings/SettingsCoins/useNetworkSettingsSearch';

import { AccountTypeSelect } from './AccountTypeSelect/AccountTypeSelect';
import { AddAccountButton } from './AddAccountButton/AddAccountButton';
import { SelectNetwork } from './SelectNetwork';
import { getSortedNetworks, getVisibleAccountCounts } from './addAccountModalUtils';
import { useNetworkActivationQueue } from './useNetworkActivationQueue';
import { verifyAvailability } from './verifyAvailability';
import { AdvancedCoinSettingsModal } from '../AdvancedCoinSettingsModal/AdvancedCoinSettingsModal';

type AddAccountProps = {
    device: TrezorDevice;
    // Callback when modal is closed, same as any other modal.
    onCancel: () => void;
    // Callback when the add-account flow completed successfully enough to resume the parent flow.
    onConfirm?: () => void;
    symbol?: NetworkSymbol;
    isCoinjoinDisabled?: boolean;
    isBackClickDisabled?: boolean;
    // Callback when the flow produced a specific single usable account (not when enabling a pinned network).
    onAddAccount?: (account: Account) => void;
};

export const AddAccountModal = ({
    device,
    onCancel,
    onConfirm,
    symbol,
    onAddAccount,
    isCoinjoinDisabled,
    isBackClickDisabled,
}: AddAccountProps) => {
    const accounts = useSelector(selectAccounts);
    const isDebug = useSelector(selectIsDebugModeActive);
    const isCoinjoinPublic = useSelector(selectIsPublic);
    const enabledNetworkSymbols = useSelector(selectEnabledNetworks);
    const useTestnetNetworks = useSelector(selectIsTestnetNetworksEnabled);
    const dispatch = useDispatch();
    const { activateNetwork, activatingNetworkSymbols, activationErrors } =
        useNetworkActivationQueue(device);

    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const { setCoinFilter, setSearchString, coinFilter } = useAccountSearch();

    const closeModalAndNotifyCompletion = useCallback(() => {
        onCancel();
        onConfirm?.();
    }, [onCancel, onConfirm]);

    const resetAccountSearch = (networkSymbol: NetworkSymbol) => {
        // Reset the account search so the new account is visible in the list.
        setSearchString(undefined);
        if (coinFilter && !coinFilter.includes(networkSymbol)) {
            // Reset an active filter only when it does not include the added account.
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

    const { supportedMainnets, supportedTestnets } = useNetworkSupport();

    const supportedNetworks = [...supportedMainnets, ...supportedTestnets];
    const allTestnetNetworksDisabled = !supportedTestnets.some(network =>
        enabledNetworkSymbols.includes(network.symbol),
    );
    const isBitcoinOnlyFirmware = hasBitcoinOnlyFirmware(device);

    // Applied when changing account in trading exchange receive options context.
    const networkPinned = !!symbol;
    const shouldKeepModalOpen = !networkPinned && !onAddAccount;
    const preselectedNetwork = symbol && supportedNetworks.find(n => n.symbol === symbol);
    // Applied when only BTC is enabled on bitcoin-only firmware.
    const bitcoinOnlyDefaultNetworkSelection =
        isBitcoinOnlyFirmware && supportedMainnets.length === 1 && allTestnetNetworksDisabled
            ? getNetwork(asNetworkSymbol('btc'))
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
    // TODO after this refactoring, no need to track it here, it will be a selector https://github.com/trezor/trezor-suite/issues/31779
    const [addingAccountNetworkSymbol, setAddingAccountNetworkSymbol] = useState<NetworkSymbol>();
    const addingAccountNetworkSymbolRef = useRef<NetworkSymbol | undefined>(undefined);

    const closeAdvancedSettings = () => setAdvancedSettingsSymbol(undefined);
    const shouldStartAddingAccount = (networkSymbol: NetworkSymbol) => {
        if (addingAccountNetworkSymbolRef.current) {
            return false;
        }

        addingAccountNetworkSymbolRef.current = networkSymbol;
        setAddingAccountNetworkSymbol(networkSymbol);

        return true;
    };
    const finishAddingAccount = () => {
        addingAccountNetworkSymbolRef.current = undefined;
        setAddingAccountNetworkSymbol(undefined);
    };

    const availableNetworksSymbols = useAvailableNetworkSymbols();

    const enabledNetworks = availableNetworksSymbols.map(networkSymbol =>
        getNetwork(networkSymbol),
    );
    const disabledNetworks = supportedNetworks.filter(
        network => !availableNetworksSymbols.includes(network.symbol),
    );
    // `getSortedNetworks` sorts first enabled, then disabled networks. But we call it only once to maintain
    // a stable order, so that the network rows don't jump around when networks are enabled/disabled.
    const [stableNetworks] = useState(() =>
        getSortedNetworks({
            availableNetworks: [
                ...supportedMainnets,
                ...(useTestnetNetworks ? supportedTestnets : []),
            ],
            enabledNetworkSymbols: availableNetworksSymbols,
        }),
    );
    const allSearchableNetworks = networkPinned ? [] : stableNetworks;

    const {
        searchQuery,
        hasNoSearchResults,
        filterNetworks,
        handleSearchChange,
        handleSearchClear,
    } = useNetworkSettingsSearch(allSearchableNetworks, { origin: 'add-account' });

    const filteredNetworks = filterNetworks(stableNetworks);
    const accountCounts = useMemo(
        () => getVisibleAccountCounts(accounts, device.state?.staticSessionId),
        [accounts, device.state?.staticSessionId],
    );

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

    const filteredDisabledNetworks = filterNetworksBySymbol(disabledNetworks, symbol);
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

    function enablePinnedNetwork(network: Network) {
        dispatch(changeCoinVisibilityThunk({ symbol: network.symbol, shouldBeVisible: true }));
        closeModalAndNotifyCompletion();
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
        if (addingAccountNetworkSymbolRef.current) {
            return;
        }

        if (shouldKeepModalOpen) {
            dispatch(preserveModal());
        }

        const finishEnableAccount = (addedAccount: Account) => {
            resetAccountSearch(addedAccount.symbol);
            reportNewAccountAnalytics(addedAccount);
            dispatch(reportWalletBalanceThunk());
            dispatch(
                notificationsActions.addToast({
                    type: 'account-added',
                    networkName: getNetwork(addedAccount.symbol).name,
                }),
            );

            if (shouldKeepModalOpen) {
                setAccountTypeSelectionNetwork(undefined);
                setSelectedAccount(undefined);

                return;
            }

            closeModalAndNotifyCompletion();
            onAddAccount?.(addedAccount);
        };

        if (!account.visible) {
            dispatch(accountsActions.changeAccountVisibility(account));
            finishEnableAccount(account);

            return;
        }

        if (!shouldStartAddingAccount(account.symbol)) {
            return;
        }

        try {
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
        } finally {
            finishAddingAccount();
        }
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
        if (!shouldStartAddingAccount(network.symbol)) {
            return;
        }

        if (shouldKeepModalOpen) {
            dispatch(preserveModal());
        }

        try {
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

            const createAccountAction = accountsActions.createAccount(newAccount);
            dispatch(createAccountAction);
            const addedAccount = createAccountAction.payload;
            resetAccountSearch(addedAccount.symbol);
            reportNewAccountAnalytics(addedAccount);
            dispatch(reportWalletBalanceThunk());
            dispatch(
                notificationsActions.addToast({
                    type: 'account-added',
                    networkName: getNetwork(addedAccount.symbol).name,
                }),
            );

            if (shouldKeepModalOpen) {
                setAccountTypeSelectionNetwork(undefined);
                setSelectedAccount(undefined);

                return;
            }

            closeModalAndNotifyCompletion();
            onAddAccount?.(addedAccount);
        } finally {
            finishAddingAccount();
        }
    }

    const handleNetworkSelection = async (networkSymbol?: NetworkSymbol) => {
        if (!networkSymbol) {
            setAccountTypeSelectionNetwork(undefined);

            return;
        }

        const networkToSelect = getNetwork(networkSymbol);

        if (!enabledNetworkSymbols.includes(networkToSelect.symbol)) {
            if (networkPinned) {
                enablePinnedNetwork(networkToSelect);
            } else {
                activateNetwork(networkToSelect.symbol);
            }

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

    const getStepConfig = () =>
        isAccountTypeSelectionStep
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
                          isLoading={
                              addingAccountNetworkSymbol === accountTypeSelectionNetwork.symbol
                          }
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
                  children: networkPinned ? (
                      <Column gap={24}>
                          <SelectNetwork
                              networks={visibleNetworks}
                              enabledNetworkSymbols={enabledNetworkSymbols}
                              accountCounts={accountCounts}
                              addingAccountNetworkSymbol={addingAccountNetworkSymbol}
                              handleNetworkSelection={handleNetworkSelection}
                              onSettings={setAdvancedSettingsSymbol}
                              getAddDisabledMessage={getAddDisabledMessage}
                          />
                      </Column>
                  ) : (
                      <Column gap={24}>
                          <NetworkSettingsSearchInput
                              searchQuery={searchQuery}
                              onSearchChange={handleSearchChange}
                              onSearchClear={handleSearchClear}
                              dataTestId="@modal/account/network-search-input"
                              rightContent={
                                  <Tooltip
                                      tooltipMaxWidth={285}
                                      content={
                                          <Translation id="TR_ADD_ACCOUNT_NETWORKS_BANNER_DESCRIPTION" />
                                      }
                                      placement="bottom"
                                  >
                                      <Icon
                                          as={InfoIcon}
                                          size={20}
                                          intent="neutral"
                                          priority="secondary"
                                      />
                                  </Tooltip>
                              }
                          />
                          <Column padding={{ bottom: 8 }}>
                              <AddAccountBannerAboutNetworks />
                              {hasNoSearchResults ? (
                                  <Box padding={{ vertical: 32 }}>
                                      <NoNetworkSearchResults dataTestId="@modal/account/no-networks-found" />
                                  </Box>
                              ) : (
                                  <SelectNetwork
                                      networks={filteredNetworks}
                                      enabledNetworkSymbols={enabledNetworkSymbols}
                                      accountCounts={accountCounts}
                                      activatingNetworkSymbols={activatingNetworkSymbols}
                                      addingAccountNetworkSymbol={addingAccountNetworkSymbol}
                                      activationErrors={activationErrors}
                                      handleNetworkSelection={handleNetworkSelection}
                                      onSettings={setAdvancedSettingsSymbol}
                                      getAddDisabledMessage={getAddDisabledMessage}
                                  />
                              )}
                          </Column>
                      </Column>
                  ),
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
