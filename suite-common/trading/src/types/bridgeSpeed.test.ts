import { isCctpBridgeProvider } from './bridgeSpeed';

describe('bridgeSpeed', () => {
    describe('isCctpBridgeProvider', () => {
        it('should return true for circle-cctp', () => {
            expect(isCctpBridgeProvider('circle-cctp')).toBe(true);
        });

        it.each(['changelly', 'mercuryo', '', undefined])(
            'should return false for %s',
            providerId => {
                expect(isCctpBridgeProvider(providerId)).toBe(false);
            },
        );
    });
});
