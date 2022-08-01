import { FormDraftPrefixKeyValues } from '@suite-common/wallet-constants';

import { getFormDraftKey } from '../formDraftUtils';

describe('form draft utils', () => {
    it('getFormDraftKey', () => {
        FormDraftPrefixKeyValues.forEach(prefix => {
            expect(getFormDraftKey(prefix, 'key')).toEqual(`${prefix}/key`);
        });
    });
});
