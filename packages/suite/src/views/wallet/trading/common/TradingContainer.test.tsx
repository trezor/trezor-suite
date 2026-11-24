import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';
import { type Coins, type CryptoId } from 'invity-api';

import { mockNetworksState } from '@suite-common/networks/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { toTokenAddress } from '@suite-common/tokens';
import { initialState as tradingInitialState } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { TradingContainer } from './TradingContainer';
import { TradingCryptoAmount } from './TradingCryptoAmount';
import { type MockSuiteState, mockInitialAppState } from '../../../../../mocks/mockInitialAppState';

jest.mock('./TradingFooter/TradingFooter', () => ({ TradingFooter: () => null }));
jest.mock('./TradingLayout/useTradingPageHeader', () => ({ useTradingPageHeader: jest.fn() }));

// Invity lowercases EVM contracts, while accounts store them checksummed.
const USDC_CRYPTO_ID = 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CryptoId;
const USDC_ACCOUNT_CONTRACT = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

const coins = {
    [USDC_CRYPTO_ID]: {
        symbol: 'usdc',
        name: 'USD Coin',
        coingeckoId: 'usd-coin',
        services: { buy: true, sell: true, exchange: true },
    },
} satisfies Coins;

const usdcAccount = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    tokens: [
        {
            standard: 'ERC20',
            contract: toTokenAddress(USDC_ACCOUNT_CONTRACT),
            symbol: 'usdc',
            name: 'USD Coin',
            decimals: 6,
            balance: '60',
        },
    ],
});

const renderAmountInContainer = (accounts: Account[]) => {
    const { services } = createTestCompositionRoot<void, MockSuiteState>({
        preloadedState: {
            ...mockInitialAppState,
            networks: mockNetworksState([asNetworkSymbol('eth')]),
            wallet: {
                ...mockInitialAppState.wallet,
                accounts,
                trading: {
                    ...tradingInitialState,
                    info: { ...tradingInitialState.info, coins },
                },
            },
        } satisfies MockSuiteState,
    });

    renderWithProviders(
        services,
        <TradingContainer>
            <TradingCryptoAmount amount="60" cryptoId={USDC_CRYPTO_ID} testId="amount" />
        </TradingContainer>,
    );
};

describe('TradingContainer', () => {
    it('shows the symbol of a catalog token the user does not hold', () => {
        renderAmountInContainer([]);

        expect(screen.getByTestId('amount-with-symbol')).toHaveTextContent('60 USDC');
    });

    it('shows the symbol of a held token whose account contract differs in case', () => {
        renderAmountInContainer([usdcAccount]);

        expect(screen.getByTestId('amount-with-symbol')).toHaveTextContent('60 USDC');
    });
});
