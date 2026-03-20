import { type TestStore, initStore, renderHookWithStoreProvider } from '@suite-native/test-utils';

import { useIsNetworkReserveBannerVisible } from '../useIsNetworkReserveBannerVisible';

// SOL nativeTokenReserve: "0.003"; base: "0.0002"
describe('useIsNetworkReserveBannerVisible', () => {
    let store: TestStore;

    beforeEach(() => {
        store = initStore().store;
    });

    const renderHook = (params: Parameters<typeof useIsNetworkReserveBannerVisible>[0]) =>
        renderHookWithStoreProvider(() => useIsNetworkReserveBannerVisible(params), { store });

    it('returns false for null symbol, null amount, null balance, or no-reserve network', () => {
        expect(renderHook({ symbol: undefined, amount: '1', balance: '2' }).result.current).toBe(
            false,
        );
        expect(renderHook({ symbol: 'sol', amount: null, balance: '1' }).result.current).toBe(
            false,
        );
        expect(renderHook({ symbol: 'sol', amount: '1', balance: null }).result.current).toBe(
            false,
        );
        expect(renderHook({ symbol: 'btc', amount: '0.5', balance: '1' }).result.current).toBe(
            false,
        );
    });

    it('returns false for tokens (contractAddress set)', () => {
        expect(
            renderHook({
                symbol: 'sol',
                contractAddress: 'some-token-contract',
                amount: '0.998',
                balance: '1.0',
            }).result.current,
        ).toBe(false);
    });

    it('shows banner when remainder is at or below static network reserve (no maxAmount)', () => {
        // remainder = 1.0 - 0.997 = 0.003 = SOL reserve
        expect(renderHook({ symbol: 'sol', amount: '0.997', balance: '1.0' }).result.current).toBe(
            true,
        );
        // remainder = 1.0 - 0.998 = 0.002 < 0.003
        expect(renderHook({ symbol: 'sol', amount: '0.998', balance: '1.0' }).result.current).toBe(
            true,
        );
    });

    it('hides banner when amount is below reserve zone', () => {
        expect(renderHook({ symbol: 'sol', amount: '0.5', balance: '1.0' }).result.current).toBe(
            false,
        );
    });

    it('hides banner when amount exceeds balance', () => {
        expect(renderHook({ symbol: 'sol', amount: '1.1', balance: '1.0' }).result.current).toBe(
            false,
        );
    });

    it('hides banner for zero amount', () => {
        expect(renderHook({ symbol: 'sol', amount: '0', balance: '1.0' }).result.current).toBe(
            false,
        );
    });

    it('shows banner when amount equals composed maxAmount (send / fee path)', () => {
        // feeWithReserve = balance - maxAmount = 0.01; remainder = 0.01
        expect(
            renderHook({
                symbol: 'sol',
                amount: '0.99',
                balance: '1.0',
                maxAmount: '0.99',
            }).result.current,
        ).toBe(true);
    });

    it('hides banner when below composed maxAmount threshold', () => {
        expect(
            renderHook({
                symbol: 'sol',
                amount: '0.5',
                balance: '1.0',
                maxAmount: '0.99',
            }).result.current,
        ).toBe(false);
    });

    it('shows banner on base network at reserve boundary', () => {
        // remainder = 0.1 - 0.0999 = 0.0001 <= base reserve 0.0002
        expect(
            renderHook({ symbol: 'base', amount: '0.0999', balance: '0.1' }).result.current,
        ).toBe(true);
    });
});
