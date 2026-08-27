import { createSafeConnectError } from './connectErrorUtils';

describe('createSafeConnectError', () => {
    it('keeps the error code and drops the raw TrezorConnect message', () => {
        const error = createSafeConnectError(
            {
                message:
                    'Invalid parameter "account.utxo" (= [{"address":"addr1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wxhxx9r9y"}]): Expected array',
                code: 'Method_InvalidParameter',
            },
            'cardanoComposeTransaction',
        );

        expect(error.message).toBe('cardanoComposeTransaction failed: Method_InvalidParameter');
        expect(error.cause).toBe('Method_InvalidParameter');
    });

    it('names the method that failed', () => {
        const error = createSafeConnectError(
            { message: 'Device disconnected', code: 'Device_Disconnected' },
            'cardanoSignTransaction',
        );

        expect(error.message).toBe('cardanoSignTransaction failed: Device_Disconnected');
    });
});
