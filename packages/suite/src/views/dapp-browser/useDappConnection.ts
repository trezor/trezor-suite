import { useCallback, useEffect, useState } from 'react';

import { type DappCatalogEntry } from '@suite/dapp-browser';
import { selectVisibleDeviceAccountsByNetworkSymbol } from '@suite-common/wallet-core';
import { desktopApi } from '@trezor/suite-desktop-api';

import { useSelector } from 'src/hooks/suite';

// PoC is Ethereum-mainnet only (§14); the picker lists the device's ETH accounts.
const ETHEREUM_SYMBOL = 'eth';

// Manages the ephemeral visibility grant (§8): the selected account + chainId
// pushed to the host so the provider's state lane (eth_accounts/eth_chainId)
// resolves, plus the accountsChanged event when the user re-points the picker.
export const useDappConnection = (entry: DappCatalogEntry) => {
    const accounts = useSelector(state =>
        selectVisibleDeviceAccountsByNetworkSymbol(state, ETHEREUM_SYMBOL),
    );
    const chainId = entry.chains[0] ?? 1;

    const [selectedAddress, setSelectedAddress] = useState<string | undefined>(
        accounts[0]?.descriptor,
    );

    useEffect(() => {
        if (!selectedAddress && accounts[0]) {
            setSelectedAddress(accounts[0].descriptor);
        }
    }, [accounts, selectedAddress]);

    // Auto-connect (§4): push the selected account as the grant. Opening the
    // dApp is the connection consent; this grants visibility only, never signing.
    const connect = useCallback(() => {
        if (selectedAddress) {
            desktopApi.dappBrowserSetGrant({ address: selectedAddress, chainId });
        }
    }, [selectedAddress, chainId]);

    const selectAccount = useCallback(
        (address: string) => {
            setSelectedAddress(address);
            desktopApi.dappBrowserSetGrant({ address, chainId });
            desktopApi.dappBrowserEmitEvent({ event: 'accountsChanged', data: [address] });
        },
        [chainId],
    );

    return { accounts, selectedAddress, chainId, connect, selectAccount };
};
