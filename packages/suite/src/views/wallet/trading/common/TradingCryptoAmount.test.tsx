import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';
import { type CryptoId } from 'invity-api';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { TradingCryptoAmount } from './TradingCryptoAmount';
import { type MockSuiteState, mockInitialAppState } from '../../../../../mocks/mockInitialAppState';

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    useTradingUtils: () => ({
        cryptoIdToSymbolAndContractAddress: () => ({
            coinSymbol: asNetworkSymbol('sol'),
            contractAddress: undefined,
        }),
    }),
}));

const renderCryptoAmount = (isDiscreetModeActive: boolean) => {
    const { services } = createTestCompositionRoot<void, MockSuiteState>({
        preloadedState: {
            ...mockInitialAppState,
            discreetMode: { isActive: isDiscreetModeActive },
        },
    });

    renderWithProviders(
        services,
        <TradingCryptoAmount amount="0.05" cryptoId={'solana' as CryptoId} />,
    );
};

describe('TradingCryptoAmount', () => {
    it('shows the crypto amount with its symbol', () => {
        renderCryptoAmount(false);

        expect(screen.getByTestId('@trading/form/info/crypto-amount')).toHaveTextContent(
            '0.05 SOL',
        );
    });

    // Recurring bug: https://github.com/trezor/trezor-suite/issues/23861
    it('hides the crypto amount behind the discreet mode placeholder', () => {
        renderCryptoAmount(true);

        const cryptoAmount = screen.getByTestId('@trading/form/info/crypto-amount');

        expect(cryptoAmount).toHaveTextContent('### SOL');
        expect(cryptoAmount).not.toHaveTextContent('0.05');
    });
});
