import { DISCREET_PLACEHOLDER, redactNumericalSubstring } from '@suite-common/discreet-mode';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { DiscreetText } from './DiscreetText';

describe('DiscreetText', () => {
    it.each(['Version 123', 123, 0])(
        'does not rewrite caller-provided content (%s)',
        async value => {
            const { getByText } = await renderWithStoreProvider(
                <DiscreetText isForcedDiscreetMode>{value}</DiscreetText>,
            );

            expect(getByText(String(value), { includeHiddenElements: true })).toBeOnTheScreen();
        },
    );

    it('conceals raw text explicitly redacted by its caller', async () => {
        const { getByText, queryByText } = await renderWithStoreProvider(
            <DiscreetText isForcedDiscreetMode>
                {redactNumericalSubstring('Claim 1234.56 ETH')}
            </DiscreetText>,
            { preloadedState: { discreetMode: { isActive: false } } },
        );

        expect(queryByText('Claim 1234.56 ETH', { includeHiddenElements: true })).toBeNull();
        expect(
            getByText(`Claim ${DISCREET_PLACEHOLDER} ETH`, { includeHiddenElements: true }),
        ).not.toBeVisible();
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
            <DiscreetText>{`${DISCREET_PLACEHOLDER} BTC`}</DiscreetText>,
            { preloadedState: { discreetMode: { isActive: true } } },
        );

        expect(getByTestId('discreet-text')).toBeVisible();
        expect(
            getByText(`${DISCREET_PLACEHOLDER} BTC`, { includeHiddenElements: true }),
        ).not.toBeVisible();
    });
});
