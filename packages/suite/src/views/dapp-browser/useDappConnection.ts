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

    // Re-point the dApp at another account: update the grant, then reload the
    // view so the dApp re-initialises and connects to the newly selected account
    // (set-grant must land before the reload, hence the await chain).
    const selectAccount = useCallback(
        async (address: string) => {
            // Re-selecting the current account would reload the view for nothing.
            if (address === selectedAddress) {
                return;
            }

            setSelectedAddress(address);
            await desktopApi.dappBrowserSetGrant({ address, chainId });
            await desktopApi.dappBrowserReload();
        },
        [chainId, selectedAddress],
    );

    return { accounts, selectedAddress, chainId, selectAccount };
};
