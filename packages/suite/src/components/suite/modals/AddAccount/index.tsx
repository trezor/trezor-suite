import React, { useState } from 'react';
import styled from 'styled-components';
import { Button } from '@trezor/components';
import { Translation, Modal } from '@suite-components';
import { NETWORKS } from '@wallet-config';
import { Account, Network } from '@wallet-types';
import { TrezorDevice } from '@suite-types';
import { useSelector, useActions } from '@suite-hooks';
import * as accountActions from '@wallet-actions/accountActions';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import * as routerActions from '@suite-actions/routerActions';
import { arrayPartition } from '@trezor/utils';

import { AccountTypeSelect } from './components/AccountTypeSelect';
import { SelectNetwork } from './components/SelectNetwork';
import { EnableNetwork } from './components/EnableNetwork';
import { AddAccountButton } from './components/AddAccountButton';

const StyledModal = styled(Modal)`
    min-height: 550px;
    text-align: left;
`;

const Expander = styled.div`
    display: flex;
    flex: 1;
`;
interface Props {
    device: TrezorDevice;
    onCancel: () => void;
    symbol?: Account['symbol'];
    noRedirect?: boolean;
}

export const AddAccount = ({ device, onCancel, symbol, noRedirect }: Props) => {
    const { changeAccountVisibility, changeCoinVisibility, goto } = useActions({
        changeAccountVisibility: accountActions.changeAccountVisibility,
        changeCoinVisibility: walletSettingsActions.changeCoinVisibility,
        goto: routerActions.goto,
    });
    const {
        app,
        debug,
        accounts,
        enabledNetworks: enabledNetworksSymbols,
    } = useSelector(state => ({
        app: state.router.app,
        accounts: state.wallet.accounts,
        debug: state.suite.settings.debug,
        enabledNetworks: state.wallet.settings.enabledNetworks,
    }));

    // Collect all Networks without "accountType" (normal)
    const internalNetworks = NETWORKS.filter(n => !n.accountType && !n.isHidden);

    // applied only when changing account in coinmarket exchange receive options context so far
    const networkPinned = !!symbol;
    const preselectedNetwork = symbol && internalNetworks.find(n => n.symbol === symbol);

    const [selectedNetwork, selectNetwork] = useState<Network | undefined>(preselectedNetwork);

    const selectedNetworkEnabled =
        !!selectedNetwork && enabledNetworksSymbols.includes(selectedNetwork.symbol);

    const [enabledNetworks, disabledNetworks] = arrayPartition(internalNetworks, network =>
        enabledNetworksSymbols.includes(network.symbol),
    );
    const hasDisabledNetworks = !!disabledNetworks?.length;

    const [disabledMainnetNetworks, disabledTestnetNetworks] = arrayPartition(
        disabledNetworks,
        network => !network?.testnet,
    );

    const availableDisabledTestnetNetworks = disabledTestnetNetworks.filter(
        (n: Network) => !(n.symbol === 'regtest' && !debug.showDebugMenu),
    );

    const handleNetworkSelection = (symbol?: Network['symbol']) => {
        if (symbol) {
            const networkToSelect = NETWORKS.find(n => n.symbol === symbol);

            // To prevent account type selection reset
            const alreadySelected =
                !!networkToSelect && networkToSelect?.symbol === selectedNetwork?.symbol;

            if (networkToSelect && !networkPinned && !alreadySelected) {
                selectNetwork(networkToSelect);
            }
        } else {
            selectNetwork(undefined);
        }
    };

    const onEnableNetwork = () => {
        onCancel();
        if (selectedNetwork) {
            changeCoinVisibility(selectedNetwork.symbol, true);
            if (app === 'wallet' && !noRedirect) {
                // redirect to account only if added from "wallet" app
                goto('wallet-index', {
                    params: {
                        symbol: selectedNetwork.symbol,
                        accountIndex: 0,
                        accountType: 'normal',
                    },
                });
            }
        }
    };

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
        selectedNetworkEnabled && selectedNetwork?.networkType === 'bitcoin'
            ? NETWORKS.filter(n => n.symbol === selectedNetwork.symbol)
            : undefined;

    const onEnableAccount = (account: Account) => {
        onCancel();
        changeAccountVisibility(account);
        if (app === 'wallet' && !noRedirect) {
            // redirect to account only if added from "wallet" app
            goto('wallet-index', {
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            });
        }
    };

    const selectedNetworks = selectedNetwork ? [selectedNetwork.symbol] : [];

    return (
        <StyledModal
            isCancelable
            onCancel={onCancel}
            heading={<Translation id="MODAL_ADD_ACCOUNT_TITLE" />}
            bottomBar={
                selectedNetwork &&
                (selectedNetworkEnabled ? (
                    <AddAccountButton
                        network={selectedNetwork}
                        emptyAccounts={emptyAccounts}
                        onEnableAccount={onEnableAccount}
                    />
                ) : (
                    <Button variant="primary" onClick={onEnableNetwork}>
                        <Translation
                            id="TR_ENABLE_NETWORK_BUTTON"
                            values={{ networkName: selectedNetwork.name }}
                        />
                    </Button>
                ))
            }
        >
            <SelectNetwork
                networks={
                    selectedNetwork && selectedNetworkEnabled ? [selectedNetwork] : enabledNetworks
                }
                networkCanChange={!!selectedNetwork && selectedNetworkEnabled && !networkPinned}
                selectedNetworks={selectedNetworks}
                handleNetworkSelection={handleNetworkSelection}
            />
            {!selectedNetworkEnabled && hasDisabledNetworks && (
                <EnableNetwork
                    networks={disabledMainnetNetworks}
                    testnetNetworks={availableDisabledTestnetNetworks}
                    selectedNetworks={selectedNetworks}
                    handleNetworkSelection={handleNetworkSelection}
                />
            )}
            {selectedNetwork && (
                <>
                    {accountTypes && accountTypes?.length > 1 && (
                        <AccountTypeSelect
                            network={selectedNetwork}
                            accountTypes={accountTypes}
                            onSelectAccountType={selectNetwork}
                            unavailableCapabilities={device.unavailableCapabilities}
                        />
                    )}

                    <Expander />
                </>
            )}
        </StyledModal>
    );
};
