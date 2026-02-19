const mockIsProduction = jest.fn();

jest.mock('@suite-native/config', () => ({
    isProduction: () => mockIsProduction(),
}));

const importModules = () => {
    const { TRADING_URL_BASE, TRADING_URL_DEFAULT_BACK } = require('../../consts');
    const { doesUrlContainCloseCallbackUrl } = require('../utils');

    return { TRADING_URL_BASE, TRADING_URL_DEFAULT_BACK, doesUrlContainCloseCallbackUrl };
};

describe('utils', () => {
    describe('doesUrlContainCloseCallbackUrl - dev', () => {
        let doesUrlContainCloseCallbackUrl: (url: string, closeCallbackUrl?: string) => boolean;

        beforeAll(() => {
            mockIsProduction.mockReturnValue(false);
            jest.isolateModules(() => {
                ({ doesUrlContainCloseCallbackUrl } = importModules());
            });
        });

        it('should return true when URL contains dev base', () => {
            const url = 'trezorsuite://trading?action=trade&tradeType=buy&orderId=123';
            expect(doesUrlContainCloseCallbackUrl(url, 'trezorsuite://trading')).toBe(true);
        });

        it('should return true when URL contains dev default back', () => {
            const url = 'trezorsuite://trading/back?action=trade&tradeType=buy&orderId=123';
            expect(doesUrlContainCloseCallbackUrl(url)).toBe(true);
        });

        it('should return false when URL does not match', () => {
            const url = 'https://example.com/trading?action=trade&tradeType=buy&orderId=123';
            expect(doesUrlContainCloseCallbackUrl(url)).toBe(false);
        });

        it('should return false when URL does not contain closeCallbackUrl', () => {
            const url = 'https://example.com/trading?action=trade&tradeType=buy&orderId=123';
            expect(doesUrlContainCloseCallbackUrl(url, 'trezorsuite://trading')).toBe(false);
        });

        it('should handle empty URL', () => {
            expect(doesUrlContainCloseCallbackUrl('', 'trezorsuite://trading')).toBe(false);
        });

        it('should handle URL with special characters', () => {
            const url =
                'trezorsuite://trading?action=trade&tradeType=buy&orderId=dd070b73-fe29-4769-8be1-4075d6b43265&transactionId=8c9476a7-958b-412b-a378-3a3f59b6105a&baseCurrencyCode=czk&baseCurrencyAmount=384.78&transactionStatus=completed';
            expect(doesUrlContainCloseCallbackUrl(url, 'trezorsuite://trading')).toBe(true);
        });
    });

    describe('doesUrlContainCloseCallbackUrl - production', () => {
        let TRADING_URL_BASE: string;
        let TRADING_URL_DEFAULT_BACK: string;
        let doesUrlContainCloseCallbackUrl: (url: string, closeCallbackUrl?: string) => boolean;

        beforeAll(() => {
            mockIsProduction.mockReturnValue(true);
            jest.isolateModules(() => {
                ({ TRADING_URL_BASE, TRADING_URL_DEFAULT_BACK, doesUrlContainCloseCallbackUrl } =
                    importModules());
            });
        });

        it('should use production URL base', () => {
            expect(TRADING_URL_BASE).toBe('https://trezor.io/suite/deeplinks/trade');
            expect(TRADING_URL_DEFAULT_BACK).toBe('https://trezor.io/suite/deeplinks/trade/back');
        });

        it('should return true when URL contains production base', () => {
            const url =
                'https://trezor.io/suite/deeplinks/trade?action=trade&tradeType=buy&orderId=123';
            expect(doesUrlContainCloseCallbackUrl(url, TRADING_URL_BASE)).toBe(true);
        });

        it('should return true when URL contains production default back', () => {
            const url =
                'https://trezor.io/suite/deeplinks/trade/back?action=trade&tradeType=buy&orderId=123';
            expect(doesUrlContainCloseCallbackUrl(url)).toBe(true);
        });

        it('should not match dev URL with production base', () => {
            const url = 'trezorsuite://trading?action=trade&tradeType=buy&orderId=123';
            expect(doesUrlContainCloseCallbackUrl(url, TRADING_URL_BASE)).toBe(false);
        });
    });
});
