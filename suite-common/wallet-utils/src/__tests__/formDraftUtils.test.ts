import { FormDraftPrefixKeyValues } from '@suite-common/wallet-constants';
import { type FormDraftWithSendKeyPrefix } from '@suite-common/wallet-types';

import { getFormDraftKey, isFormDraftKeyPrefix } from '../formDraftUtils';

describe('form draft utils', () => {
    it('getFormDraftKey', () => {
        FormDraftPrefixKeyValues.forEach(prefix => {
            expect(getFormDraftKey(prefix, 'key')).toEqual(`${prefix}/key`);
        });
    });

    describe('isFormDraftKeyPrefix', () => {
        it('should be false for "send"', () => {
            expect(isFormDraftKeyPrefix('send')).toBe(false);
        });

        it.each<FormDraftWithSendKeyPrefix>(['stake', 'trading-exchange', 'trading-buy'])(
            'should be true for "%s"',
            prefix => {
                expect(isFormDraftKeyPrefix(prefix)).toBe(true);
            },
        );
    });
});
