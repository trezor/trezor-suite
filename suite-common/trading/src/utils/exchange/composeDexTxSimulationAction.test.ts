import { type ExchangeTrade } from 'invity-api';

import { type Account } from '@suite-common/wallet-types';

import { composeDexTxSimulationAction } from './composeDexTxSimulationAction';
import { accountEth } from '../../__fixtures__/utils';

const sourceOrigin = 'trezor-suite://exchange';

// Sentry serializes Error args as message + stack; JSON.stringify(Error) returns '{}' because
// message/stack are non-enumerable, so serialize the way captureConsoleIntegration does to
// actually detect the leak (mirrors accountsActions.test.ts / ethereumStaking.test.ts).
const serializeSentryStyle = (arg: unknown): string => {
    if (arg instanceof Error) {
        return `${arg.message}\n${arg.stack ?? ''}`;
    }

    return typeof arg === 'string' ? arg : JSON.stringify(arg);
};

describe('composeDexTxSimulationAction', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    it('does not leak the transaction amount to the log when fromEther throws', () => {
        // fromEther/toBN throws `Value '<value>' is invalid (...)` for a >18-decimal amount,
        // embedding the exact (confidential) transaction amount in the error message.
        const secretAmount = '12.123456789012345678901';
        const quote = {
            isDex: true,
            dexTx: {
                from: '0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3',
                to: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
                value: secretAmount,
                data: '0x71ee95c0',
            },
        } as unknown as ExchangeTrade;

        const result = composeDexTxSimulationAction({
            quote,
            account: accountEth as unknown as Account,
            sourceOrigin,
        });

        expect(result).toBeNull();
        expect(consoleErrorSpy).toHaveBeenCalled();

        // No logged argument (serialized the way Sentry serializes it) may contain the amount.
        const leaked = consoleErrorSpy.mock.calls
            .flat()
            .some(arg => serializeSentryStyle(arg).includes(secretAmount));
        expect(leaked).toBe(false);
    });
});
