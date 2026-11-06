import { type TokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { renderWithStoreProvider, screen } from '@suite-native/test-utils-store';

import { TokenToFiatAmountFormatter } from './TokenToFiatAmountFormatter';

const ETH = asNetworkSymbol('eth');
const USDC_CONTRACT = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;

const createPreloadedState = ({
    knownContracts,
    rates,
}: {
    knownContracts: TokenAddress[];
    rates: Record<string, { rate: number }>;
}) => ({
    wallet: { accounts: [], fiat: { current: rates, lastWeek: {} } },
    tokenDefinitions: { [ETH]: { coin: { data: knownContracts, hide: [], show: [] } } },
});

const renderFormatter = (preloadedState: ReturnType<typeof createPreloadedState>) =>
    renderWithStoreProvider(
        <TokenToFiatAmountFormatter symbol={ETH} contract={USDC_CONTRACT} value="720" />,
        { preloadedState },
    );

describe('TokenToFiatAmountFormatter', () => {
    it('renders the fiat value of a token with a rate', async () => {
        await renderFormatter(
            createPreloadedState({
                knownContracts: [USDC_CONTRACT],
                rates: { [`eth-${USDC_CONTRACT}-usd`]: { rate: 1 } },
            }),
        );

        expect(screen.getByText('$720.00')).toBeTruthy();
    });

    it('renders a placeholder while the rate of a known token is loading', async () => {
        await renderFormatter(createPreloadedState({ knownContracts: [USDC_CONTRACT], rates: {} }));

        expect(screen.toJSON()).not.toBeNull();
    });

    it('renders a placeholder before the token definitions load', async () => {
        await renderWithStoreProvider(
            <TokenToFiatAmountFormatter symbol={ETH} contract={USDC_CONTRACT} value="720" />,
            { preloadedState: { wallet: { accounts: [], fiat: { current: {}, lastWeek: {} } } } },
        );

        expect(screen.toJSON()).not.toBeNull();
    });

    it('renders nothing for an unknown token, whose rate is never fetched', async () => {
        await renderFormatter(createPreloadedState({ knownContracts: [], rates: {} }));

        expect(screen.toJSON()).toBeNull();
    });
});
