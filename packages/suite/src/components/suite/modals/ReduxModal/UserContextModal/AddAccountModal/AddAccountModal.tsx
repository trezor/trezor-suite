import { useState } from 'react';
import styled from 'styled-components';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { accountsActions, selectSupportedNetworks } from '@suite-common/wallet-core';
import { Button, CoinLogo, CollapsibleBox } from '@trezor/components';
import { FirmwareType } from '@trezor/connect';
import { spacingsPx } from '@trezor/theme';
import { arrayPartition } from '@trezor/utils';
import { Translation, Modal, CoinList } from 'src/components/suite';
import { NETWORKS } from 'src/config/wallet';
import { Account, Network } from 'src/types/wallet';
import { TrezorDevice } from 'src/types/suite';
import { useSelector, useDispatch } from 'src/hooks/suite';
import { changeCoinVisibility } from 'src/actions/settings/walletSettingsActions';
import { goto } from 'src/actions/suite/routerActions';
import { selectIsPublic } from 'src/reducers/wallet/coinjoinReducer';
import { useEnabledNetworks } from 'src/hooks/settings/useEnabledNetworks';
import { AccountTypeSelect } from './AccountTypeSelect/AccountTypeSelect';
import { SelectNetwork } from './SelectNetwork';
import { AddAccountButton } from './AddAccountButton/AddAccountButton';

const StyledModal = styled(Modal)`
    width: 480px;
    text-align: left;
`;

const NetworksWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.md};
`;

const CoinLogoWrapper = styled.span`
    display: inline;
    margin-right: ${spacingsPx.xxs};
    vertical-align: text-top;
`;

const StyledCollapsibleBox = styled(CollapsibleBox)`
    margin-top: ${spacingsPx.md};
`;

interface AddAccountProps {
    device: TrezorDevice;
    onCancel: () => void;
    symbol?: NetworkSymbol;
    noRedirect?: boolean;
}

export const AddAccountModal = ({ device, onCancel, symbol, noRedirect }: AddAccountProps) => {
    const accounts = useSelector(state => state.wallet.accounts);
    const supportedNetworkSymbols = useSelector(selectSupportedNetworks);
    const app = useSelector(state => state.router.app);
    const debug = useSelector(state => state.suite.settings.debug);
    const isCoinjoinPublic = useSelector(selectIsPublic);
    const dispatch = useDispatch();

    const { mainnets, testnets, enabledNetworks: enabledNetworkSymbols } = useEnabledNetworks();

    const getSupportedNetworks = (networks: Network[]) =>
        networks.filter(network => supportedNetworkSymbols.includes(network.symbol));

    const supportedMainnets = getSupportedNetworks(mainnets);
    const supportedTestnets = getSupportedNetworks(testnets);
    const supportedNetworks = [...supportedMainnets, ...supportedTestnets];
    const allTestnetNetworksDisabled = supportedTestnets.some(network =>
        enabledNetworkSymbols.includes(network.symbol),
    );

    const isCoinjoinVisible = isCoinjoinPublic || debug.showDebugMenu;

    // applied when changing account in coinmarket exchange receive options context
    const networkPinned = !!symbol;
    const preselectedNetwork = symbol && supportedNetworks.find(n => n.symbol === symbol);
    // or in case of only btc is enabled on bitcoin-only firmware
    const bitcoinNetwork = NETWORKS.find(n => n.symbol === 'btc');
    const bitcoinOnlyDefaultNetworkSelection =
        device.firmwareType === FirmwareType.BitcoinOnly &&
        supportedMainnets.length === 1 &&
        allTestnetNetworksDisabled
            ? bitcoinNetwork
            : undefined;

    const [selectedNetwork, setSelectedNetwork] = useState<Network | undefined>(
        preselectedNetwork || bitcoinOnlyDefaultNetworkSelection,
    );

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
    const currentType = selectedNetwork?.accountType ?? 'normal';
    const emptyAccounts = selectedNetwork
        ? accounts.filter(
              a =>
                  a.deviceState === device.state &&
                  a.symbol === selectedNetwork.symbol &&
                  a.accountType === currentType &&
                  a.empty,
          )
        : [];

    // Collect possible accountTypes
    const accountTypes =
        isSelectedNetworkEnabled && selectedNetwork?.networkType === 'bitcoin'
            ? NETWORKS.filter(n => n.symbol === selectedNetwork.symbol)
                  /**
                   * Filter out coinjoin account type if it is not visible.
                   * Visibility of coinjoin account type depends on coinjoin feature config in message system.
                   * By default it is visible publicly, but it can be remotely hidden under debug menu.
                   */
                  .filter(({ backendType }) => backendType !== 'coinjoin' || isCoinjoinVisible)
            : undefined;

    const selectedNetworks = selectedNetwork ? [selectedNetwork.symbol] : [];

    const selectNetwork = (symbol?: Network['symbol']) => {
        if (symbol) {
            const networkToSelect = NETWORKS.find(n => n.symbol === symbol);

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
                              network: (
                                  <>
                                      <CoinLogoWrapper>
                                          <CoinLogo size={24} symbol={selectedNetwork.symbol} />
                                      </CoinLogoWrapper>
                                      {selectedNetwork.name}
                                  </>
                              ),
                          }}
                      />
                  ),
                  subheading: <Translation id="TR_SELECT_TYPE" />,
                  children: (
                      <AccountTypeSelect
                          network={selectedNetwork}
                          accountTypes={accountTypes}
                          onSelectAccountType={setSelectedNetwork}
                      />
                  ),
                  onBackClick: () => setSelectedNetwork(undefined),
              }
            : {
                  heading: <Translation id="TR_ADD_ACCOUNT" />,
                  headingSize: 'large',
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
                              <StyledCollapsibleBox
                                  variant="small"
                                  heading={<Translation id="TR_TESTNET_COINS" />}
                              >
                                  <CoinList
                                      onToggle={selectNetwork}
                                      networks={disabledTestnetNetworks}
                                      selectedNetworks={selectedNetworks}
                                  />
                              </StyledCollapsibleBox>
                          )}
                      </>
                  ),
              };
    };
    return (
        <StyledModal
            isCancelable
            onCancel={onCancel}
            bottomBarComponents={
                selectedNetwork &&
                (isSelectedNetworkEnabled ? (
                    <AddAccountButton
                        network={selectedNetwork}
                        emptyAccounts={emptyAccounts}
                        onEnableAccount={addAccount}
                    />
                ) : (
                    <Button variant="primary" size="small" onClick={enableNetwork}>
                        <Translation
                            id="TR_ENABLE_NETWORK_BUTTON"
                            values={{ networkName: selectedNetwork.name }}
                        />
                    </Button>
                ))
            }
            {...getStepConfig()}
        />
    );
};
