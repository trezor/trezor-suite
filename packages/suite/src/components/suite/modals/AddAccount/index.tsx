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
    const { app, accounts, enabledNetworks, selectedAccount } = useSelector(state => ({
        app: state.router.app,
        accounts: state.wallet.accounts,
        enabledNetworks: state.wallet.settings.enabledNetworks,
        selectedAccount: state.wallet.selectedAccount,
    }));

    // Collect all Networks without "accountType" (normal)
    const internalNetworks = NETWORKS.filter(n => !n.accountType && !n.isHidden);

    // Collect device unavailable capabilities
    const unavailableCapabilities = props.device.features
        ? props.device.unavailableCapabilities
        : {};

    // if symbol is passed in the props, preselect it and pin it (do not allow the user to change it)
    // otherwise default value is currently selected network or first network item on the list (btc)
    const symbol = props.symbol ? props.symbol : selectedAccount.account?.symbol;
    const preselectedNetwork = symbol
        ? (internalNetworks.find(n => n.symbol === symbol) as Network)
        : internalNetworks[0];

    const [network, setNetwork] = useState<Network>(preselectedNetwork);
    const [accountType, setAccountType] = useState<Network | undefined>(undefined);

    // Common props for Wrapper
    const wrapperProps = {
        selectedNetwork: network,
        internalNetworks,
        onSelectNetwork: (network: Network) => {
            setNetwork(network);
            setAccountType(undefined);
        },
        onSelectAccountType: setAccountType,
        onCancel: props.onCancel,
    };

    // Check device capabilities
    // Display: unavailable network
    const capability = unavailableCapabilities[network.symbol];
    if (capability) {
        return (
            <Wrapper {...wrapperProps}>
                <NetworkUnavailable capability={capability} network={network} />
            </Wrapper>
        );
    }

    // Display: Network is not enabled in settings
    if (!enabledNetworks.includes(network.symbol)) {
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
                pinNetwork={!!props.symbol}
            />
        );
    }

    // Collect all empty accounts related to selected device and selected accountType
    const currentType = (accountType ? accountType.accountType : undefined) || 'normal';
    const emptyAccounts = accounts.filter(
        a =>
            a.deviceState === props.device.state &&
            a.symbol === network.symbol &&
            a.accountType === currentType &&
            a.empty,
    );

    // Collect possible accountTypes
    const accountTypes =
        network.networkType === 'bitcoin'
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
            selectedAccountType={accountType}
            accountTypes={accountTypes}
            actionButton={
                <AddAccountButton
                    network={network}
                    accounts={emptyAccounts}
                    onEnableAccount={onEnableAccount}
                />
            }
            pinNetwork={!!props.symbol}
        >
            <NetworkInternal network={accountType || network} accountTypes={accountTypes} />
        </Wrapper>
    );
};

export default AddAccount;
