import { TRADING_URL_DEFAULT_BACK } from '../../consts';
import { doesUrlContainCloseCallbackUrl } from '../utils';

describe('utils', () => {
    describe('doesUrlContainCloseCallbackUrl', () => {
        const closeCallbackUrl = 'trezorsuite://trading';

        it('should return true when URL contains closeCallbackUrl', () => {
            const url = 'trezorsuite://trading?action=trade&tradeType=buy&orderId=123';
            expect(doesUrlContainCloseCallbackUrl(url, closeCallbackUrl)).toBe(true);
        });

        it('should return true when URL contains TRADING_URL_DEFAULT_BACK', () => {
            const url = `${TRADING_URL_DEFAULT_BACK}?action=trade&tradeType=buy&orderId=123`;
            expect(doesUrlContainCloseCallbackUrl(url)).toBe(true);
        });

        it('should return false when URL does not contain TRADING_URL_DEFAULT_BACK', () => {
            const url = 'https://example.com/trading?action=trade&tradeType=buy&orderId=123';
            expect(doesUrlContainCloseCallbackUrl(url)).toBe(false);
        });

        it('should return false when URL does not contain closeCallbackUrl', () => {
            const url = 'https://example.com/trading?action=trade&tradeType=buy&orderId=123';
            expect(doesUrlContainCloseCallbackUrl(url, closeCallbackUrl)).toBe(false);
        });

        it('should handle empty URL', () => {
            expect(doesUrlContainCloseCallbackUrl('', closeCallbackUrl)).toBe(false);
        });

        it('should handle URL with special characters', () => {
            const url =
                'trezorsuite://trading?action=trade&tradeType=buy&orderId=dd070b73-fe29-4769-8be1-4075d6b43265&transactionId=8c9476a7-958b-412b-a378-3a3f59b6105a&baseCurrencyCode=czk&baseCurrencyAmount=384.78&transactionStatus=completed';
            expect(doesUrlContainCloseCallbackUrl(url, closeCallbackUrl)).toBe(true);
        });

        it('should handle url without specifying closeCallbackUrl', () => {
            const url = `${TRADING_URL_DEFAULT_BACK}?action=trade&tradeType=buy&orderId=123`;
            expect(doesUrlContainCloseCallbackUrl(url)).toBe(true);
        });
    });
});
