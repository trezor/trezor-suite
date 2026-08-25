import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { configureMockStore } from '@suite-common/test-utils';
import { getNetwork } from '@suite-common/wallet-config';
import { getExplorerUrl } from '@suite-common/wallet-config/src/getExplorerUrls';
import { explorerInitialState } from '@suite-common/wallet-core';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type TokenTransfer } from '@trezor/connect';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { FormattedNftAmount } from './FormattedNftAmount';
import { extraDependenciesDesktopMock } from '../../../mocks/extraDependenciesDesktopMock';
import { mockInitialAppState } from '../../../mocks/mockInitialAppState';

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
        explorer: explorerInitialState,
        selectedAccount: {
            status: 'loaded',
            account: ethereumAccount,
            network: getNetwork(ethereumAccount.symbol),
            params: undefined,
        },
    },
});

describe('FormattedNftAmount', () => {
    it('opens a token in the explorer of its own network, not of the selected account', () => {
        const store = configureMockStore({ preloadedState: getInitialState() });

        renderWithProviders(
            store,
            extraDependenciesDesktopMock.services,
            <FormattedNftAmount transfer={nftTransfer} networkSymbol="pol" isWithLink />,
        );

        const polygonNftUrl = getExplorerUrl(explorerInitialState.pol.default, 'nft');
        const ethereumNftUrl = getExplorerUrl(explorerInitialState.eth.default, 'nft');

        expect(polygonNftUrl).not.toBe(ethereumNftUrl);
        expect(screen.getByRole('link')).toHaveAttribute(
            'href',
            `${polygonNftUrl}${nftTransfer.contract}/${nftTransfer.amount}`,
        );
    });
});
