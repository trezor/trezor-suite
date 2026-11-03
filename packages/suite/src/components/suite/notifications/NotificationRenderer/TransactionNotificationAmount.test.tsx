import '@suite-common/test-utils/globalOverrides';

import { screen, within } from '@testing-library/react';

import { HiddenPlaceholder } from '@suite/discreet-mode';
import { messages } from '@suite/intl';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import {
    TransactionNotificationAmount,
    type TransactionNotificationAmountProps,
} from './TransactionNotificationAmount';
import { mockInitialAppState } from '../../../../../mocks/mockInitialAppState';

const ethSymbol = asNetworkSymbol('eth');

const renderAmount = (props: TransactionNotificationAmountProps) => {
    const { services } = createTestCompositionRoot<void, AppState>({
        preloadedState: mockInitialAppState,
    });

    // The toast wraps its amount in a HiddenPlaceholder, which the crypto amount relies on.
    renderWithProviders(
        services,
        <HiddenPlaceholder data-testid="@amount">
            <TransactionNotificationAmount {...props} />
        </HiddenPlaceholder>,
    );
};

describe('TransactionNotificationAmount', () => {
    it('renders an NFT token ID as an ID, not divided by its decimals', () => {
        renderAmount({
            amount: '737',
            symbol: ethSymbol,
            token: { standard: 'ERC721', contract: '0xnft', symbol: 'XYZ', decimals: 18 },
            isSymbolRenderedBesideAmount: false,
        });

        const amount = screen.getByTestId('@amount');
        expect(amount).toHaveTextContent(messages.TR_TOKEN_ID_COLON.defaultMessage);
        expect(within(amount).getByText('737')).toBeInTheDocument();
        expect(within(amount).getByText('XYZ')).toBeInTheDocument();
    });

    it('renders a fungible token amount with its symbol', () => {
        renderAmount({
            amount: '1.5',
            symbol: ethSymbol,
            token: { standard: 'ERC20', contract: '0xa0b8', symbol: 'USDC', decimals: 6 },
            isSymbolRenderedBesideAmount: false,
        });

        expect(screen.getByTestId('@amount')).toHaveTextContent('1.50 USDC');
        expect(screen.getByTestId('@amount')).not.toHaveTextContent(
            messages.TR_TOKEN_ID_COLON.defaultMessage,
        );
    });
});
