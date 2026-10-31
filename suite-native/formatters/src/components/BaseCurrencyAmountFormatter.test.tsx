import { DISCREET_PLACEHOLDER } from '@suite-common/discreet-mode';
import { toFiatCurrency } from '@suite-common/wallet-utils';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { BaseCurrencyAmountFormatter } from './BaseCurrencyAmountFormatter';

const amount = toFiatCurrency({ amount: '123', rate: 1 });

describe('BaseCurrencyAmountFormatter', () => {
    it.each(['auto', 'enforced', 'disabled'] as const)(
        'shows a skeleton for an unknown amount in %s mode',
        async discreetMode => {
            const { getByText, queryByTestId } = await renderWithStoreProvider(
                <BaseCurrencyAmountFormatter value={null} discreetMode={discreetMode} />,
            );

            // EmptyAmountSkeleton contains a zero-width space to preserve its line height.
            expect(getByText('\u200b')).toBeVisible();
            expect(
                queryByTestId('discreet-placeholder', { includeHiddenElements: true }),
            ).toBeNull();
        },
    );

    it.each([
        { value: null, isLoading: false },
        { value: amount, isLoading: true },
    ])('redacts the amount after loading in enforced mode (%j)', async props => {
        const { getByText, queryByText, getByTestId, rerender } = await renderWithStoreProvider(
            <BaseCurrencyAmountFormatter {...props} discreetMode="enforced" />,
            { preloadedState: { discreetMode: { isActive: false } } },
        );

        expect(getByText('\u200b')).toBeVisible();

        await rerender(<BaseCurrencyAmountFormatter value={amount} discreetMode="enforced" />);

        // Enforced mode conceals the loaded amount even when global discreet mode is off.
        // The redacted text stays mounted for layout beneath the blurred placeholder.
        const redactedAmount = getByText(`$${DISCREET_PLACEHOLDER}`, {
            includeHiddenElements: true,
        });
        expect(redactedAmount).toBeOnTheScreen();
        expect(redactedAmount).not.toBeVisible();
        expect(
            getByTestId('discreet-placeholder', { includeHiddenElements: true }),
        ).toBeOnTheScreen();
        expect(queryByText('\u200b', { includeHiddenElements: true })).toBeNull();
        expect(queryByText('$123.00', { includeHiddenElements: true })).toBeNull();
    });
});
