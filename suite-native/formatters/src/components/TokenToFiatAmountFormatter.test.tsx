import { type TokenAddress } from '@suite-common/wallet-types';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { TokenToFiatAmountFormatter } from './TokenToFiatAmountFormatter';

describe('TokenToFiatAmountFormatter', () => {
    it('redacts an unavailable conversion in enforced mode instead of showing a skeleton', async () => {
        const { getByText, queryByText } = await renderWithStoreProvider(
            <TokenToFiatAmountFormatter
                value="1"
                symbol="eth"
                contract={'0x0000000000000000000000000000000000000001' as TokenAddress}
                discreetMode="enforced"
            />,
            { preloadedState: { wallet: { fiat: { current: {} } } } },
        );

        // The redacted text stays mounted for layout; Discreet draws a blurred placeholder over it.
        const redactedAmount = getByText('$###', { includeHiddenElements: true });
        expect(redactedAmount).toBeOnTheScreen();
        expect(redactedAmount).not.toBeVisible();

        // EmptyAmountSkeleton contains a zero-width space to preserve its line height.
        expect(queryByText('\u200b', { includeHiddenElements: true })).toBeNull();
        expect(queryByText('$0.00', { includeHiddenElements: true })).toBeNull();
    });
});
