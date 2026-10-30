import { discreetModeActions, discreetModeReducer } from '@suite-common/discreet-mode';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { Discreet } from '@suite-native/atoms';
import {
    act,
    createLightStore,
    createStaticReducer,
    createStoreFromPreloadedState,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';

import { CompactCryptoAmountFormatter } from './CompactCryptoAmountFormatter';
import { ExactCryptoAmountFormatter } from './ExactCryptoAmountFormatter';

describe('Crypto amount formatters', () => {
    const ethSymbol = asNetworkSymbol('eth');

    it('updates the rendered amount when discreet mode changes', async () => {
        const defaultState = createStoreFromPreloadedState().getState();
        const store = createLightStore({
            reducer: {
                discreetMode: discreetModeReducer,
                wallet: createStaticReducer(defaultState.wallet),
                locale: createStaticReducer(defaultState.locale),
            },
        });
        const { getByText, queryByText } = await renderWithStoreProvider(
            <ExactCryptoAmountFormatter value="1234567.89" symbol={ethSymbol} />,
            { services: { store } },
        );

        expect(getByText('1,234,567.89 ETH')).toBeVisible();

        await act(() => {
            store.dispatch(discreetModeActions.setDiscreetMode(true));
        });

        expect(queryByText('1,234,567.89 ETH', { includeHiddenElements: true })).toBeNull();
        expect(getByText('### ETH', { includeHiddenElements: true })).not.toBeVisible();

        await act(() => {
            store.dispatch(discreetModeActions.setDiscreetMode(false));
        });

        expect(getByText('1,234,567.89 ETH')).toBeVisible();
    });

    it('keeps explicitly public amounts visible in discreet mode', async () => {
        const { getByText } = await renderWithStoreProvider(
            <ExactCryptoAmountFormatter
                value="1.239"
                symbol={ethSymbol}
                // Exercise the public-value opt-out while global discreet mode is enabled.
                discreetMode="disabled"
            />,
            { preloadedState: { discreetMode: { isActive: true } } },
        );

        expect(getByText('1.239 ETH')).toBeVisible();
    });

    it('enforces redaction when global discreet mode is off', async () => {
        const { getByText, queryByText } = await renderWithStoreProvider(
            <ExactCryptoAmountFormatter
                value="1234567.89"
                symbol={ethSymbol}
                // Exercise forced concealment while the global setting is off.
                discreetMode="enforced"
            />,
            { preloadedState: { discreetMode: { isActive: false } } },
        );

        expect(getByText('### ETH', { includeHiddenElements: true })).not.toBeVisible();
        expect(queryByText('1,234,567.89 ETH', { includeHiddenElements: true })).toBeNull();
    });

    it.each(['auto', 'enforced', 'disabled'] as const)(
        'inherits redaction from a forced discreet parent in %s mode',
        async discreetMode => {
            const { getByText, queryByText } = await renderWithStoreProvider(
                <Discreet isForcedDiscreetMode>
                    <ExactCryptoAmountFormatter
                        value="1234567.89"
                        symbol={ethSymbol}
                        discreetMode={discreetMode}
                    />
                </Discreet>,
            );

            expect(getByText('### ETH', { includeHiddenElements: true })).not.toBeVisible();
            expect(queryByText('1,234,567.89 ETH', { includeHiddenElements: true })).toBeNull();
        },
    );

    it.each([ExactCryptoAmountFormatter, CompactCryptoAmountFormatter])(
        'redacts numbers and conceals the complete amount (%#)',
        async Formatter => {
            const { getByTestId, getByText, queryByText } = await renderWithStoreProvider(
                <Formatter value="1234567.89" symbol={ethSymbol} />,
                { preloadedState: { discreetMode: { isActive: true } } },
            );

            expect(getByTestId('discreet-text', { includeHiddenElements: true })).toHaveTextContent(
                '### ETH',
            );
            expect(getByText('### ETH', { includeHiddenElements: true })).not.toBeVisible();
            expect(queryByText(/1,234,567/)).toBeNull();
        },
    );

    it('renders exact value', async () => {
        const { getByTestId } = await renderWithStoreProvider(
            <ExactCryptoAmountFormatter value="1.239" symbol={ethSymbol} />,
        );

        expect(getByTestId('plain-text')).toHaveTextContent('1.239 ETH');
    });

    it.each([
        ['positive', '+1.23 ETH'],
        ['negative', '-1.23 ETH'],
        [undefined, '1.23 ETH'],
    ] as const)('renders a native amount with %s direction', async (signValue, expected) => {
        const { getByTestId } = await renderWithStoreProvider(
            <CompactCryptoAmountFormatter value="1.239" symbol={ethSymbol} signValue={signValue} />,
        );

        expect(getByTestId('plain-text')).toHaveTextContent(expected);
    });

    it('renders compact value with compact wrapper', async () => {
        const { getByTestId } = await renderWithStoreProvider(
            <CompactCryptoAmountFormatter value="1.239" symbol={ethSymbol} />,
        );

        expect(getByTestId('plain-text')).toHaveTextContent('1.23 ETH');
    });
});
