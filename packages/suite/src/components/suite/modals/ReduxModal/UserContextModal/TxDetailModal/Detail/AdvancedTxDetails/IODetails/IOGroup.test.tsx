import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { getNetwork } from '@suite-common/wallet-config';
import { getExplorerUrl } from '@suite-common/wallet-config/src/getExplorerUrls';
import { explorerInitialState } from '@suite-common/wallet-core';
import { type WalletAccountTransaction, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { type IODetailsType } from './IODetailsType';
import { IOGroup } from './IOGroup';
import { mockInitialAppState } from '../../../../../../../../../../mocks/mockInitialAppState';

const bitcoinAccount = mockWalletAccount({
    symbol: 'btc',
    descriptor: asAccountDescriptor('btcDescriptor'),
});
const ethereumAccount = mockWalletAccount({
    symbol: 'eth',
    descriptor: asAccountDescriptor('ethDescriptor'),
});

const bitcoinTransaction = {
    symbol: bitcoinAccount.symbol,
    descriptor: bitcoinAccount.descriptor,
    deviceState: bitcoinAccount.deviceState,
    txid: 'bitcoin-txid',
} as WalletAccountTransaction;

const inputAddress = 'bc1qtestinputaddress';
const inputs: IODetailsType[] = [{ addresses: [inputAddress] } as IODetailsType];

const getInitialState = (): AppState => ({
    ...mockInitialAppState,
    wallet: {
        ...mockInitialAppState.wallet,
        accounts: [bitcoinAccount, ethereumAccount],
        explorer: explorerInitialState,
        selectedAccount: {
            status: 'loaded',
            account: ethereumAccount,
            network: getNetwork(ethereumAccount.symbol),
            params: undefined,
        },
    },
});

describe('IOGroup', () => {
    it('opens an address in the explorer of the transaction network, not of the selected account', () => {
        const root = createTestCompositionRoot({
            extra: { services: {} },
            preloadedState: getInitialState(),
        });

        renderWithProviders(root, <IOGroup tx={bitcoinTransaction} inputs={inputs} outputs={[]} />);

        const bitcoinAddressUrl = getExplorerUrl(explorerInitialState.btc.default, 'address');
        const ethereumAddressUrl = getExplorerUrl(explorerInitialState.eth.default, 'address');

        expect(bitcoinAddressUrl).not.toBe(ethereumAddressUrl);
        expect(screen.getByRole('link')).toHaveAttribute(
            'href',
            `${bitcoinAddressUrl}${inputAddress}`,
        );
    });
});
