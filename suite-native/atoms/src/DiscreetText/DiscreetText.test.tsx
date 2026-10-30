import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { DiscreetText } from './DiscreetText';

describe('DiscreetText', () => {
    it('redacts numbers in plain text before blurring it', async () => {
        const { getByText, queryByText } = await renderWithStoreProvider(
            <DiscreetText isForcedDiscreetMode>Claim 1234.56 ETH</DiscreetText>,
            { preloadedState: { discreetMode: { isActive: false } } },
        );

        expect(queryByText('Claim 1234.56 ETH', { includeHiddenElements: true })).toBeNull();
        expect(getByText('Claim ### ETH', { includeHiddenElements: true })).not.toBeVisible();
    });

    it('keeps the amount and symbol visible when privacy mode is off', async () => {
        const { getByText } = await renderWithStoreProvider(
            <DiscreetText>1234.56 BTC</DiscreetText>,
            { preloadedState: { discreetMode: { isActive: false } } },
        );

        expect(getByText('1234.56 BTC')).toBeVisible();
    });

    it('conceals the redacted text including its symbol when privacy mode is on', async () => {
        const { getByTestId, getByText } = await renderWithStoreProvider(
            <DiscreetText>1234.56 BTC</DiscreetText>,
            { preloadedState: { discreetMode: { isActive: true } } },
        );

        expect(getByTestId('discreet-text')).toBeVisible();
        expect(getByText('### BTC', { includeHiddenElements: true })).not.toBeVisible();
    });
});
