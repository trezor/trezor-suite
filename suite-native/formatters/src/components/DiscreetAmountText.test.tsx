import {
    DISCREET_PLACEHOLDER,
    discreetModeActions,
    discreetModeReducer,
} from '@suite-common/discreet-mode';
import { useFormatters } from '@suite-common/formatters';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { Discreet } from '@suite-native/atoms';
import {
    act,
    createLightStore,
    createStaticReducer,
    createStoreFromPreloadedState,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';

import { DiscreetAmountText } from './DiscreetAmountText';

const ethSymbol = asNetworkSymbol('eth');

describe('DiscreetAmountText', () => {
    it('updates the rendered amount when discreet mode changes', async () => {
        const { result } = await renderHookWithStoreProvider(useFormatters);
        const { CryptoAmountFormatter } = result.current;
        const defaultState = createStoreFromPreloadedState().getState();
        const store = createLightStore({
            reducer: {
                discreetMode: discreetModeReducer,
                wallet: createStaticReducer(defaultState.wallet),
                locale: createStaticReducer(defaultState.locale),
            },
        });
        const { getByText, queryByText } = await renderWithStoreProvider(
            <DiscreetAmountText
                value={<CryptoAmountFormatter value="1234567.89" symbol={ethSymbol} isBalance />}
            />,
            { services: { store } },
        );

        expect(getByText('1,234,567.89 ETH')).toBeVisible();

        await act(() => {
            store.dispatch(discreetModeActions.setDiscreetMode(true));
        });

        expect(queryByText('1,234,567.89 ETH', { includeHiddenElements: true })).toBeNull();
        expect(
            getByText(`${DISCREET_PLACEHOLDER} ETH`, { includeHiddenElements: true }),
        ).not.toBeVisible();

        await act(() => {
            store.dispatch(discreetModeActions.setDiscreetMode(false));
        });

        expect(getByText('1,234,567.89 ETH')).toBeVisible();
    });

    it.each([
        { discreetMode: 'disabled', isActive: true, isParentForced: false, isConcealed: false },
        { discreetMode: 'disabled', isActive: false, isParentForced: true, isConcealed: true },
    ] as const)(
        'applies the amount privacy override (%j)',
        async ({ discreetMode, isActive, isParentForced, isConcealed }) => {
            const { result } = await renderHookWithStoreProvider(useFormatters);
            const { CryptoAmountFormatter } = result.current;
            const content = (
                <DiscreetAmountText
                    discreetMode={discreetMode}
                    value={
                        <CryptoAmountFormatter
                            value="1234567.89"
                            symbol={ethSymbol}
                            isBalance
                            formatStyle="compact-balance"
                        />
                    }
                />
            );
            const { getByText, queryByText } = await renderWithStoreProvider(
                isParentForced ? <Discreet isForcedDiscreetMode>{content}</Discreet> : content,
                { preloadedState: { discreetMode: { isActive } } },
            );

            if (isConcealed) {
                const amount = getByText(`${DISCREET_PLACEHOLDER} ETH`, {
                    includeHiddenElements: true,
                });
                expect(amount).toBeOnTheScreen();
                expect(amount).not.toBeVisible();
                expect(queryByText('1.23M ETH', { includeHiddenElements: true })).toBeNull();
            } else {
                expect(getByText('1.23M ETH')).toBeVisible();
            }
        },
    );
});
