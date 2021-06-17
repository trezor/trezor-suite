import React, { useState } from 'react';
import { Button } from '@trezor/components';
import { Translation } from '@suite-components';
import { NETWORKS } from '@wallet-config';
import { Account, Network } from '@wallet-types';
import { TrezorDevice } from '@suite-types';
import { useSelector, useActions } from '@suite-hooks';
import * as accountActions from '@wallet-actions/accountActions';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import * as routerActions from '@suite-actions/routerActions';
import { partition } from '@suite-utils/array';

import NetworkUnavailable from './components/NetworkUnavailable';
import NetworkInternal from './components/NetworkInternal';
import AddAccountButton from './components/AddAccountButton';
import Wrapper from './components/Wrapper';

interface Props {
    device: TrezorDevice;
    onCancel: () => void;
    symbol?: Account['symbol'];
    noRedirect?: boolean;
}

const AddAccount = (props: Props) => {
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
    const unavailableCapabilities = props.device.features
        ? props.device.unavailableCapabilities
        : {};

    // applied only when changing account in coinmarket exchange receive options context so far
    const preselectedNetwork =
        props.symbol && internalNetworks.find(n => n.symbol === props.symbol);

    const [network, setNetwork] = useState<Network | undefined>(preselectedNetwork);

    const networkEnabled = !!network && enabledNetworksSymbols.includes(network.symbol);

    const [enabledNetworks, disabledNetworks] = partition(internalNetworks, network =>
        enabledNetworksSymbols.includes(network.symbol),
    );
    const [disabledMainnetNetworks, disabledTestnetNetworks] = partition(
        disabledNetworks,
        network => !network?.testnet,
    );

    // Common props for Wrapper
    const wrapperProps = {
        network,
        networkEnabled,
        networkPinned: !!props.symbol,
        enabledNetworks,
        disabledMainnetNetworks,
        disabledTestnetNetworks,
        onSelectNetwork: setNetwork,
        onCancel: props.onCancel,
        unavailableCapabilities,
    };

    // Check device capabilities
    // Display: unavailable network
    const unavailableCapability = network && unavailableCapabilities[network.symbol];
    if (network && unavailableCapability) {
        return (
            <Wrapper {...wrapperProps}>
                <NetworkUnavailable capability={unavailableCapability} network={network} />
            </Wrapper>
        );
    }

    // Display: Network is not enabled in settings
    if (network && !networkEnabled) {
        const onEnableNetwork = () => {
            props.onCancel();
            changeCoinVisibility(network.symbol, true);
            if (app === 'wallet' && !props.noRedirect) {
                // redirect to account only if added from "wallet" app
                goto('wallet-index', {
                    symbol: network.symbol,
                    accountIndex: 0,
                    accountType: 'normal',
                });
            }
        };

        return (
            <Wrapper
                {...wrapperProps}
                actionButton={
                    <Button variant="primary" onClick={onEnableNetwork}>
                        <Translation
                            id="TR_ENABLE_NETWORK_BUTTON"
                            values={{ networkName: network.name }}
                        />
                    </Button>
                }
            />
        );
    }

    // Collect all empty accounts related to selected device and selected accountType
    const currentType = network?.accountType ?? 'normal';
    const emptyAccounts =
        network &&
        accounts.filter(
            a =>
                a.deviceState === props.device.state &&
                a.symbol === network.symbol &&
                a.accountType === currentType &&
                a.empty,
        );

    // Collect possible accountTypes
    const accountTypes =
        network?.networkType === 'bitcoin'
            ? NETWORKS.filter(n => n.symbol === network.symbol)
            : undefined;

    const onEnableAccount = (account: Account) => {
        props.onCancel();
        changeAccountVisibility(account);
        if (app === 'wallet' && !props.noRedirect) {
            // redirect to account only if added from "wallet" app
            goto('wallet-index', {
                symbol: account.symbol,
                accountIndex: account.index,
                accountType: account.accountType,
            });
        }
    };

    // Display: default add account window
    return (
        <Wrapper
            {...wrapperProps}
            accountTypes={accountTypes}
            actionButton={
                network &&
                emptyAccounts && (
                    <AddAccountButton
                        network={network}
                        accounts={emptyAccounts}
                        onEnableAccount={onEnableAccount}
                    />
                )
            }
        >
            {network && <NetworkInternal network={network} accountTypes={accountTypes} />}
        </Wrapper>
    );
};

export default AddAccount;
