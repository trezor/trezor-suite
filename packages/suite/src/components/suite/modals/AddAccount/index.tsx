import React, { useState } from 'react';
import styled from 'styled-components';
import { Button, P, variables } from '@trezor/components';
import { Translation, Modal } from '@suite-components';
import { NETWORKS } from '@wallet-config';
import { Account, Network } from '@wallet-types';
import { TrezorDevice } from '@suite-types';
import { useSelector, useActions } from '@suite-hooks';
import * as accountActions from '@wallet-actions/accountActions';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import * as routerActions from '@suite-actions/routerActions';
import { partition } from '@suite-utils/array';

import AccountTypeSelect from './components/AccountTypeSelect';
import AddAccount from './components/AddAccount';
import EnableNetwork from './components/EnableNetwork';
import NetworkUnavailable from './components/NetworkUnavailable';
import NetworkInternal from './components/NetworkInternal';
import AddAccountButton from './components/AddAccountButton';

const StyledModal = styled(props => <Modal {...props} />)`
    min-height: 550px;
    text-align: left;
`;

const Actions = styled.div`
    display: flex;
    justify-content: center;
`;

const Title = styled(P)`
    margin-right: 9px;
    padding: 14px 0%;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
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

const AddAccountModal = ({ device, onCancel, symbol, noRedirect }: Props) => {
    const { changeAccountVisibility, changeCoinVisibility, goto } = useActions({
        changeAccountVisibility: accountActions.changeAccountVisibility,
        changeCoinVisibility: walletSettingsActions.changeCoinVisibility,
        goto: routerActions.goto,
    });
    const { app, accounts, enabledNetworks: enabledNetworksSymbols } = useSelector(state => ({
        app: state.router.app,
        accounts: state.wallet.accounts,
        enabledNetworks: state.wallet.settings.enabledNetworks,
    }));

    // Collect all Networks without "accountType" (normal)
    const internalNetworks = NETWORKS.filter(n => !n.accountType && !n.isHidden);

    // Collect device unavailable capabilities
    const unavailableCapabilities = device.features ? device.unavailableCapabilities : {};

    // applied only when changing account in coinmarket exchange receive options context so far
    const networkPinned = !!symbol;
    const preselectedNetwork = symbol && internalNetworks.find(n => n.symbol === symbol);

    const [network, setNetwork] = useState<Network | undefined>(preselectedNetwork);

    const networkEnabled = !!network && enabledNetworksSymbols.includes(network.symbol);

    // Check device capabilities
    // Display: unavailable network
    const unavailableCapability = network && unavailableCapabilities[network.symbol];

    const [enabledNetworks, disabledNetworks] = partition(internalNetworks, network =>
        enabledNetworksSymbols.includes(network.symbol),
    );
    const [disabledMainnetNetworks, disabledTestnetNetworks] = partition(
        disabledNetworks,
        network => !network?.testnet,
    );

    const handleNetworkSelection = (symbol?: Network['symbol']) => {
        if (symbol) {
            const selectedNetwork = NETWORKS.find(n => n.symbol === symbol);
            if (selectedNetwork && !networkPinned) {
                setNetwork(selectedNetwork);
            }
        } else {
            setNetwork(undefined);
        }
    };

    const onEnableNetwork = () => {
        onCancel();
        if (network) {
            changeCoinVisibility(network.symbol, true);
            if (app === 'wallet' && !noRedirect) {
                // redirect to account only if added from "wallet" app
                goto('wallet-index', {
                    symbol: network.symbol,
                    accountIndex: 0,
                    accountType: 'normal',
                });
            }
        }
    };

    // Collect all empty accounts related to selected device and selected accountType
    const currentType = network?.accountType ?? 'normal';
    const emptyAccounts = network
        ? accounts.filter(
              a =>
                  a.deviceState === device.state &&
                  a.symbol === network.symbol &&
                  a.accountType === currentType &&
                  a.empty,
          )
        : [];

    // Collect possible accountTypes
    const accountTypes =
        networkEnabled && network?.networkType === 'bitcoin'
            ? NETWORKS.filter(n => n.symbol === network.symbol)
            : undefined;

    const onEnableAccount = (account: Account) => {
        onCancel();
        changeAccountVisibility(account);
        if (app === 'wallet' && !noRedirect) {
            // redirect to account only if added from "wallet" app
            goto('wallet-index', {
                symbol: account.symbol,
                accountIndex: account.index,
                accountType: account.accountType,
            });
        }
    };

    const selectedNetworks = network ? [network.symbol] : [];

    return (
        <StyledModal
            cancelable
            onCancel={onCancel}
            heading={<Translation id="MODAL_ADD_ACCOUNT_TITLE" />}
        >
            <AddAccount
                networks={network && networkEnabled ? [network] : enabledNetworks}
                networkCanChange={!!network && networkEnabled && !networkPinned}
                selectedNetworks={selectedNetworks}
                unavailableCapabilities={unavailableCapabilities}
                handleNetworkSelection={handleNetworkSelection}
            />
            {!networkEnabled && (
                <EnableNetwork
                    networks={disabledMainnetNetworks}
                    testnetNetworks={disabledTestnetNetworks}
                    selectedNetworks={selectedNetworks}
                    unavailableCapabilities={unavailableCapabilities}
                    handleNetworkSelection={handleNetworkSelection}
                />
            )}
            {network && (
                <>
                    {accountTypes && accountTypes?.length > 1 && (
                        <>
                            <Title>
                                <Translation id="TR_ACCOUNT_TYPE" />
                            </Title>
                            <AccountTypeSelect
                                network={network}
                                accountTypes={accountTypes}
                                onSelectAccountType={setNetwork}
                            />
                        </>
                    )}

                    {unavailableCapability ? (
                        <NetworkUnavailable capability={unavailableCapability} network={network} />
                    ) : (
                        <NetworkInternal network={network} accountTypes={accountTypes} />
                    )}

                    <Expander />

                    <Actions>
                        {networkEnabled ? (
                            <AddAccountButton
                                network={network}
                                accounts={emptyAccounts}
                                onEnableAccount={onEnableAccount}
                            />
                        ) : (
                            <Button variant="primary" onClick={onEnableNetwork}>
                                <Translation
                                    id="TR_ENABLE_NETWORK_BUTTON"
                                    values={{ networkName: network.name }}
                                />
                            </Button>
                        )}
                    </Actions>
                </>
            )}
        </StyledModal>
    );
};

export default AddAccountModal;
