import { FormDraftPrefixKeyValues } from '@wallet-constants/formDraft';
import * as formDraftUtils from '../formDraftUtils';

describe('form draft utils', () => {
    it('getFormDraftKey', () => {
        FormDraftPrefixKeyValues.forEach(prefix => {
            expect(formDraftUtils.getFormDraftKey(prefix, 'key')).toEqual(`${prefix}/key`);
        });
    });
});
