import { useState } from 'react';
import styled from 'styled-components';

import {
    accountsActions,
    selectDeviceSupportedNetworks,
    selectDeviceModel,
} from '@suite-common/wallet-core';
import { arrayPartition } from '@trezor/utils';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { networks, Network, NetworkSymbol, NetworkAccount } from '@suite-common/wallet-config';
import { CollapsibleBox, NewModal, Tooltip } from '@trezor/components';
import { spacings, spacingsPx } from '@trezor/theme';
import { Translation, CoinList } from 'src/components/suite';
import { Account } from 'src/types/wallet';
import { TrezorDevice } from 'src/types/suite';
import { useSelector, useDispatch } from 'src/hooks/suite';
import { changeCoinVisibility } from 'src/actions/settings/walletSettingsActions';
import { goto } from 'src/actions/suite/routerActions';
import { selectIsPublic } from 'src/reducers/wallet/coinjoinReducer';
import { useEnabledNetworks } from 'src/hooks/settings/useEnabledNetworks';
import { AccountTypeSelect } from './AccountTypeSelect/AccountTypeSelect';
import { SelectNetwork } from './SelectNetwork';
import { AddAccountButton } from './AddAccountButton/AddAccountButton';
import { DeviceModelInternal } from '@trezor/connect';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';

const NetworksWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.md};
`;

interface AddAccountProps {
    device: TrezorDevice;
    onCancel: () => void;
    symbol?: NetworkSymbol;
    noRedirect?: boolean;
    isCoinjoinDisabled?: boolean;
    isBackClickDisabled?: boolean;
}

export const AddAccountModal = ({
    device,
    onCancel,
    symbol,
    noRedirect,
    isCoinjoinDisabled,
    isBackClickDisabled,
}: AddAccountProps) => {
    const accounts = useSelector(state => state.wallet.accounts);
    const supportedNetworkSymbols = useSelector(selectDeviceSupportedNetworks);
    const app = useSelector(state => state.router.app);
    const isDebug = useSelector(selectIsDebugModeActive);
    const isCoinjoinPublic = useSelector(selectIsPublic);
    const deviceModel = useSelector(selectDeviceModel);
    const dispatch = useDispatch();

    const { mainnets, testnets, enabledNetworks: enabledNetworkSymbols } = useEnabledNetworks();

    const getNetworks = (networksToFilterFrom: Network[], getUnsupported = false) =>
        networksToFilterFrom.filter(
            ({ symbol }) => getUnsupported !== supportedNetworkSymbols.includes(symbol),
        );

    const supportedMainnets = getNetworks(mainnets);
    const supportedTestnets = getNetworks(testnets);
    const unsupportedNetworks = getNetworks(mainnets, true);
    const supportedNetworks = [...supportedMainnets, ...supportedTestnets];
    const allTestnetNetworksDisabled = supportedTestnets.some(network =>
        enabledNetworkSymbols.includes(network.symbol),
    );
    const isBitcoinOnlyFirmware = hasBitcoinOnlyFirmware(device);

    // applied when changing account in coinmarket exchange receive options context
    const networkPinned = !!symbol;
    const preselectedNetwork = symbol && supportedNetworks.find(n => n.symbol === symbol);
    // or in case of only btc is enabled on bitcoin-only firmware
    const bitcoinOnlyDefaultNetworkSelection =
        hasBitcoinOnlyFirmware(device) &&
        supportedMainnets.length === 1 &&
        allTestnetNetworksDisabled
            ? networks.btc
            : undefined;

    const [selectedNetwork, setSelectedNetwork] = useState<Network | undefined>(
        preselectedNetwork || bitcoinOnlyDefaultNetworkSelection,
    );
    const [selectedAccount, setSelectedAccount] = useState<NetworkAccount | undefined>(undefined);

    const isSelectedNetworkEnabled =
        !!selectedNetwork && enabledNetworkSymbols.includes(selectedNetwork.symbol);
    const [enabledNetworks, disabledNetworks] = arrayPartition(supportedNetworks, network =>
        enabledNetworkSymbols.includes(network.symbol),
    );
    const [disabledMainnetNetworks, disabledTestnetNetworks] = arrayPartition(
        disabledNetworks,
        network => !network?.testnet,
    );

    // Collect all empty accounts related to selected device and selected accountType
    const currentType = selectedAccount?.accountType ?? 'normal';
    const emptyAccounts = selectedNetwork
        ? accounts.filter(
              a =>
                  a.deviceState === device.state &&
                  a.symbol === selectedNetwork.symbol &&
                  a.accountType === currentType &&
                  a.empty,
          )
        : [];

    const isCoinjoinVisible = (isCoinjoinPublic || isDebug) && !isCoinjoinDisabled;

    const getAvailableAccountTypes = (network: Network) => {
        const defaultAccount: NetworkAccount = {
            bip43Path: network.bip43Path,
            accountType: 'normal',
        };
        const otherAccounts = Object.values(network.accountTypes)
            /**
             * Filter out coinjoin account type if it is not visible.
             * Visibility of coinjoin account type depends on coinjoin feature config in message system.
             * By default it is visible publicly, but it can be remotely hidden under debug menu.
             */
            .filter(({ backendType }) => backendType !== 'coinjoin' || isCoinjoinVisible)
            .filter(({ isDebugOnlyAccountType }) => !isDebugOnlyAccountType || isDebug);

        // the default account is expected to be the first one
        return [defaultAccount, ...otherAccounts];
    };

    const accountTypes = isSelectedNetworkEnabled
        ? getAvailableAccountTypes(selectedNetwork)
        : undefined;

    const selectedNetworks = selectedNetwork ? [selectedNetwork.symbol] : [];

    const selectNetwork = (symbol?: NetworkSymbol) => {
        if (symbol) {
            const networkToSelect = networks[symbol];

            // To prevent account type selection reset
            const alreadySelected =
                !!networkToSelect && networkToSelect?.symbol === selectedNetwork?.symbol;

            if (networkToSelect && !networkPinned && !alreadySelected) {
                setSelectedNetwork(networkToSelect);
            }
        } else {
            setSelectedNetwork(undefined);
        }
    };
    const enableNetwork = () => {
        onCancel();
        if (selectedNetwork) {
            dispatch(changeCoinVisibility(selectedNetwork.symbol, true));
            if (app === 'wallet' && !noRedirect) {
                // redirect to account only if added from "wallet" app
                dispatch(
                    goto('wallet-index', {
                        params: {
                            symbol: selectedNetwork.symbol,
                            accountIndex: 0,
                            accountType: 'normal',
                        },
                    }),
                );
            }
        }
    };
    const addAccount = (account: Account) => {
        onCancel();
        dispatch(accountsActions.changeAccountVisibility(account));
        if (app === 'wallet' && !noRedirect) {
            // redirect to account only if added from "wallet" app
            dispatch(
                goto('wallet-index', {
                    params: {
                        symbol: account.symbol,
                        accountIndex: account.index,
                        accountType: account.accountType,
                    },
                }),
            );
        }
    };

    const getStepConfig = () => {
        const isAccountTypeSelectionStep =
            !!selectedNetwork && accountTypes && accountTypes.length > 1;

        return isAccountTypeSelectionStep
            ? {
                  heading: (
                      <Translation
                          id="TR_ADD_NETWORK_ACCOUNT"
                          values={{
                              network: selectedNetwork.name,
                          }}
                      />
                  ),
                  description: <Translation id="TR_SELECT_TYPE" />,
                  children: (
                      <AccountTypeSelect
                          selectedAccountType={selectedAccount}
                          accountTypes={accountTypes}
                          onSelectAccountType={setSelectedAccount}
                          networkType={selectedNetwork.networkType}
                          symbol={selectedNetwork.symbol}
                      />
                  ),
                  onBackClick: !isBackClickDisabled
                      ? () => setSelectedNetwork(undefined)
                      : undefined,
              }
            : {
                  heading: <Translation id="TR_ADD_ACCOUNT" />,
                  children: (
                      <>
                          <NetworksWrapper>
                              <SelectNetwork
                                  heading={<Translation id="TR_ACTIVATED_COINS" />}
                                  networks={enabledNetworks}
                                  selectedNetworks={selectedNetworks}
                                  handleNetworkSelection={selectNetwork}
                              />
                              <SelectNetwork
                                  heading={<Translation id="TR_INACTIVE_COINS" />}
                                  networks={disabledMainnetNetworks}
                                  selectedNetworks={selectedNetworks}
                                  handleNetworkSelection={selectNetwork}
                              />
                          </NetworksWrapper>
                          {!!disabledTestnetNetworks.length && (
                              <CollapsibleBox
                                  heading={
                                      <Tooltip
                                          content={
                                              <Translation id="TR_TESTNET_COINS_DESCRIPTION" />
                                          }
                                          hasIcon
                                      >
                                          <Translation id="TR_TESTNET_COINS" />
                                      </Tooltip>
                                  }
                                  data-testid="@modal/account/activate_more_coins"
                                  margin={{ top: spacings.md }}
                              >
                                  <CoinList
                                      onToggle={selectNetwork}
                                      networks={disabledTestnetNetworks}
                                      enabledNetworks={selectedNetworks}
                                  />
                              </CollapsibleBox>
                          )}
                          {!!isBitcoinOnlyFirmware && deviceModel === DeviceModelInternal.T1B1 && (
                              <CollapsibleBox
                                  heading={
                                      <Tooltip
                                          hasIcon
                                          content={
                                              <Translation id="TR_UNSUPPORTED_COINS_DESCRIPTION" />
                                          }
                                      >
                                          <Translation id="TR_UNSUPPORTED_COINS" />
                                      </Tooltip>
                                  }
                                  data-testid="@modal/account/activate_more_coins"
                                  margin={{ top: spacings.md }}
                              >
                                  <CoinList
                                      onToggle={selectNetwork}
                                      networks={unsupportedNetworks}
                                      enabledNetworks={selectedNetworks}
                                  />
                              </CollapsibleBox>
                          )}
                      </>
                  ),
              };
    };

    return (
        <NewModal
            onCancel={onCancel}
            size="small"
            bottomContent={
                selectedNetwork &&
                (isSelectedNetworkEnabled ? (
                    <AddAccountButton
                        network={selectedNetwork}
                        selectedAccount={selectedAccount}
                        emptyAccounts={emptyAccounts}
                        onEnableAccount={addAccount}
                    />
                ) : (
                    <NewModal.Button onClick={enableNetwork}>
                        <Translation
                            id="TR_ENABLE_NETWORK_BUTTON"
                            values={{ networkName: selectedNetwork.name }}
                        />
                    </NewModal.Button>
                ))
            }
            {...getStepConfig()}
        />
    );
};
