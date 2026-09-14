import { mockNetworkConfigDeps } from '@suite-common/networks/mocks';

import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { getNetwork } from '@suite-common/wallet-config';
import { getExplorerUrl } from '@suite-common/wallet-config/src/getExplorerUrls';
import { createExplorerInitialState } from '@suite-common/wallet-core';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type TokenTransfer } from '@trezor/connect';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { FormattedNftAmount } from './FormattedNftAmount';
import { mockInitialAppState } from '../../../mocks/mockInitialAppState';

const networkConfigDeps = mockNetworkConfigDeps();

const ethereumAccount = mockWalletAccount({
    symbol: 'eth',
    descriptor: asAccountDescriptor('ethDescriptor'),
});

const nftTransfer: TokenTransfer = {
    type: 'sent',
    standard: 'ERC721',
    contract: '0xnftcontract',
    from: '0xsender',
    to: '0xrecipient',
    amount: '1234',
    symbol: 'NFT',
    decimals: 0,
};

const getInitialState = (): AppState => ({
    ...mockInitialAppState,
    wallet: {
        ...mockInitialAppState.wallet,
        explorer: createExplorerInitialState(networkConfigDeps.getNetworkConfigs()),
        selectedAccount: {
            status: 'loaded',
            account: ethereumAccount,
            network: getNetwork(networkConfigDeps, ethereumAccount.symbol),
            params: undefined,
        },
    },
});

describe('FormattedNftAmount', () => {
    it('opens a token in the explorer of its own network, not of the selected account', () => {
        const root = createTestCompositionRoot({
            extra: { services: {} },
            preloadedState: getInitialState(),
        });

        renderWithProviders(
            root,
            <FormattedNftAmount transfer={nftTransfer} networkSymbol="pol" isWithLink />,
        );

        const polygonNftUrl = getExplorerUrl(
            createExplorerInitialState(networkConfigDeps.getNetworkConfigs()).pol.default,
            'nft',
        );
        const ethereumNftUrl = getExplorerUrl(
            createExplorerInitialState(networkConfigDeps.getNetworkConfigs()).eth.default,
            'nft',
        );

        expect(polygonNftUrl).not.toBe(ethereumNftUrl);
        expect(screen.getByRole('link')).toHaveAttribute(
            'href',
            `${polygonNftUrl}${nftTransfer.contract}/${nftTransfer.amount}`,
        );
    });
});
