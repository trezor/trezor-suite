import { type TranslationKey } from '@suite/intl';

// The modal pulls in the wrap submit thunk (and, transitively, TrezorConnect); stub it so this pure
// validator test stays lightweight.
jest.mock('src/actions/wallet/wrapNativeTokenThunks', () => ({
    submitWrapNativeTokenThunk: jest.fn(),
}));

import { validateAmount } from '../WrapNativeTokenModal';

// Identity translator so the returned message equals the message id under test.
const translate = (id: TranslationKey) => id;

describe('WrapNativeTokenModal validateAmount', () => {
    const validate = validateAmount(translate, '1.495');

    it('accepts an amount within the max', () => {
        expect(validate('1')).toBe(true);
        expect(validate('1.495')).toBe(true);
    });

    it('rejects an amount above the max', () => {
        expect(validate('1.5')).toBe('AMOUNT_IS_NOT_ENOUGH');
    });

    it('rejects zero and negative amounts', () => {
        expect(validate('0')).toBe('AMOUNT_IS_TOO_LOW');
        expect(validate('-1')).toBe('AMOUNT_IS_TOO_LOW');
    });

    it('rejects a non-numeric amount', () => {
        expect(validate('abc')).toBe('AMOUNT_IS_TOO_LOW');
        expect(validate('')).toBe('AMOUNT_IS_TOO_LOW');
    });
});
