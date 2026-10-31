import { DISCREET_PLACEHOLDER } from '@suite-common/discreet-mode';
import { type TokenAddress } from '@suite-common/wallet-types';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { TokenToFiatAmountFormatter } from './TokenToFiatAmountFormatter';

const tokenAddress = '0x0000000000000000000000000000000000000001' as TokenAddress;

describe('TokenToFiatAmountFormatter', () => {
    it.each(['auto', 'enforced', 'disabled'] as const)(
        'shows a skeleton for an unavailable conversion in %s mode',
        async discreetMode => {
            const { getByText, queryByTestId } = await renderWithStoreProvider(
                <TokenToFiatAmountFormatter
                    value="1"
                    symbol="eth"
                    contract={tokenAddress}
                    discreetMode={discreetMode}
                />,
                { preloadedState: { wallet: { fiat: { current: {} } } } },
            );

            // EmptyAmountSkeleton contains a zero-width space to preserve its line height.
            expect(getByText('\u200b')).toBeVisible();
            expect(
                queryByTestId('discreet-placeholder', { includeHiddenElements: true }),
            ).toBeNull();
        },
    );

    it('replaces the skeleton with a redacted amount when the rate becomes available in enforced mode', async () => {
        const props = {
            value: '1',
            symbol: 'eth',
            contract: tokenAddress,
            discreetMode: 'enforced',
            useHistoricRate: true,
        } as const;
        const { getByText, queryByText, getByTestId, rerender } = await renderWithStoreProvider(
            <TokenToFiatAmountFormatter {...props} />,
            { preloadedState: { discreetMode: { isActive: false } } },
        );

        expect(getByText('\u200b')).toBeVisible();

        await rerender(<TokenToFiatAmountFormatter {...props} historicRate={123} />);

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
