import { type Account, type FormState } from '@suite-common/wallet-types';
import { type SerializedError } from '@trezor/connect-common/src/constants/errors';

const setExtra = jest.fn();
const setTag = jest.fn();
const captureException = jest.fn();

jest.mock('@sentry/core', () => ({
    withScope: (cb: (scope: { setTag: unknown; setExtra: unknown }) => void) =>
        cb({ setTag, setExtra }),
    captureException: (...args: unknown[]) => captureException(...args),
}));

import { reportEthereumFeeEstimationFailed } from './reportEthereumFeeEstimationError';

const CONFIDENTIAL_FROM = '0x1111111111111111111111111111111111111111';
const CONFIDENTIAL_BALANCE = '999999999999999999';

const baseAccount = {
    symbol: 'eth',
    accountType: 'normal',
    descriptor: CONFIDENTIAL_FROM,
} as unknown as Account;

const baseFormState = {
    transactionData: undefined,
    ethereumAdjustGasLimit: undefined,
    selectedFee: 'normal',
} as unknown as FormState;

describe('reportEthereumFeeEstimationFailed', () => {
    beforeEach(() => {
        setExtra.mockClear();
        setTag.mockClear();
        captureException.mockClear();
    });

    it('never forwards the raw backend error message (from-address / balance / amount) to Sentry', () => {
        // Realistic geth eth_estimateGas failure forwarded verbatim by blockbook: it embeds
        // the from-address, the account balance and the intended amount.
        const error = {
            // give each test a unique code so the module-level dedup Set does not swallow it
            code: 'insufficient_funds_case',
            message: `insufficient funds for gas * price + value: address ${CONFIDENTIAL_FROM} have ${CONFIDENTIAL_BALANCE} want 1000000000000000000`,
        };

        reportEthereumFeeEstimationFailed({
            account: baseAccount,
            formState: baseFormState,
            tokenInfo: undefined,
            estimateTarget: '0x2222222222222222222222222222222222222222',
            error: error as unknown as SerializedError,
        });

        // it still reports (so the failure is observable) ...
        expect(captureException).toHaveBeenCalledTimes(1);

        // ... but no tag or extra value may carry the confidential parts of the message
        const forwarded = [...setExtra.mock.calls, ...setTag.mock.calls]
            .map(args => String(args[1]))
            .join('|');
        expect(forwarded).not.toContain(CONFIDENTIAL_FROM);
        expect(forwarded).not.toContain(CONFIDENTIAL_BALANCE);
    });

    it('still buckets the failure via the sanitized connectErrorCode tag', () => {
        const error = {
            code: 'execution_reverted_case',
            message: 'execution reverted',
        };

        reportEthereumFeeEstimationFailed({
            account: baseAccount,
            formState: baseFormState,
            tokenInfo: undefined,
            estimateTarget: '0x3333333333333333333333333333333333333333',
            error: error as unknown as SerializedError,
        });

        expect(setTag).toHaveBeenCalledWith('fee.connectErrorCode', 'execution_reverted_case');
    });
});
