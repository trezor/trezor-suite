import { ERROR_CODES } from '@trezor/connect-common/src/constants/errors';

import { toConnectV9ErrorPayload } from './connectV9ErrorPayload';

describe('toConnectV9ErrorPayload', () => {
    it('keeps the error of the call and adds the text Connect 9 reads', () => {
        expect(
            toConnectV9ErrorPayload({
                code: 'Method_NotAllowed',
                message: 'Update to Connect 10.',
            }),
        ).toEqual({
            code: 'Method_NotAllowed',
            message: 'Update to Connect 10.',
            error: 'Update to Connect 10.',
        });
    });

    it('falls back to the code of an error without a message', () => {
        expect(toConnectV9ErrorPayload({ code: 'Method_NotAllowed' })).toEqual({
            code: 'Method_NotAllowed',
            error: 'Method_NotAllowed',
        });
    });

    it('falls back to a generic text without an error', () => {
        expect(toConnectV9ErrorPayload(undefined)).toEqual({
            error: ERROR_CODES.Failure_UnknownCode,
        });
    });
});
