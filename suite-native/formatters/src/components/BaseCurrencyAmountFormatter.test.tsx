import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { BaseCurrencyAmountFormatter } from './BaseCurrencyAmountFormatter';

describe('BaseCurrencyAmountFormatter', () => {
    it('redacts an unknown amount in enforced mode instead of showing a skeleton', async () => {
        const { getByText, queryByText } = await renderWithStoreProvider(
            <BaseCurrencyAmountFormatter value={null} discreetMode="enforced" />,
        );

        expect(getByText('$###', { includeHiddenElements: true })).not.toBeVisible();
        expect(queryByText('\u200b', { includeHiddenElements: true })).toBeNull();
        expect(queryByText('$0.00', { includeHiddenElements: true })).toBeNull();
    });

    it('keeps the loading skeleton for an unknown amount in auto mode', async () => {
        const { getByText, queryByTestId } = await renderWithStoreProvider(
            <BaseCurrencyAmountFormatter value={null} />,
        );

        expect(getByText('\u200b')).toBeVisible();
        expect(queryByTestId('discreet-placeholder', { includeHiddenElements: true })).toBeNull();
    });
});
