import React, { useState } from 'react';
import { Button, Link } from '@trezor/components';
import { Translation } from '@suite-components';
import { NETWORKS, EXTERNAL_NETWORKS } from '@wallet-config';
import { Account, Network, ExternalNetwork } from '@wallet-types';
import messages from '@suite/support/messages';
import NetworkUnavailable from './components/NetworkUnavailable';
import NetworkExternal from './components/NetworkExternal';
import NetworkInternal from './components/NetworkInternal';
import AddAccountButton from './components/AddAccountButton';
import Wrapper from './components/Wrapper';
import { Props } from './Container';

const AddAccount = (props: Props) => {
    // Collect all Networks without "accountType" (normal)
    const internalNetworks = NETWORKS.filter(n => !n.accountType && !n.isHidden);
    const externalNetworks = EXTERNAL_NETWORKS.filter(n => !n.isHidden);

    // Collect device unavailable capabilities
    const unavailableCapabilities = props.device.features
        ? props.device.unavailableCapabilities
        : {};

    // Use component state, default value is currently selected network or first network item on the list (btc)
    const { account } = props.selectedAccount;
    const preselectedNetwork = account
        ? (internalNetworks.find(n => n.symbol === account.symbol) as Network)
        : internalNetworks[0];

    const [network, setNetwork] = useState<Network | ExternalNetwork>(preselectedNetwork);
    const [accountType, setAccountType] = useState<Network | undefined>(undefined);

    // Common props for Wrapper
    const wrapperProps = {
        selectedNetwork: network,
        internalNetworks,
        externalNetworks,
        onSelectNetwork: (network: Network | ExternalNetwork) => {
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

    // Display: external network
    if (network.networkType === 'external') {
        return (
            <Wrapper
                {...wrapperProps}
                actionButton={
                    <Link href={network.url} variant="nostyle">
                        <Button icon="EXTERNAL_LINK" variant="primary" onClick={props.onCancel}>
                            <Translation id="TR_GO_TO_EXTERNAL_WALLET" />
                        </Button>
                    </Link>
                }
            >
                <NetworkExternal network={network} />
            </Wrapper>
        );
    }

    // Display: Network is not enabled in settings
    if (!props.enabledNetworks.includes(network.symbol)) {
        const onEnableNetwork = () => {
            props.onCancel();
            props.changeCoinVisibility(network.symbol, true);
            if (props.app === 'wallet') {
                // redirect to account only if added from "wallet" app
                props.goto('wallet-index', {
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
                            {...messages.TR_ENABLE_NETWORK_BUTTON}
                            values={{ networkName: network.name }}
                        />
                    </Button>
                }
            />
        );
    }

    // Collect all empty accounts related to selected device and selected accountType
    const currentType = (accountType ? accountType.accountType : undefined) || 'normal';
    const emptyAccounts = props.accounts.filter(
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
        props.changeAccountVisibility(account);
        if (props.app === 'wallet') {
            // redirect to account only if added from "wallet" app
            props.goto('wallet-index', {
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
        >
            <NetworkInternal network={accountType || network} accountTypes={accountTypes} />
        </Wrapper>
    );
};

export default AddAccount;
