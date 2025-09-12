import * as helpers from '@trezor/env-utils';

import { FeedbackType } from '../src';
import { FEEDBACK_ENDPOINT, getFeedbackUrl } from '../src/getFeedbackUrl';

describe(getFeedbackUrl.name, () => {
    it.each([
        ['BUG', true, `${FEEDBACK_ENDPOINT}/bugs/stable.log`],
        ['BUG', false, `${FEEDBACK_ENDPOINT}/bugs/develop.log`],
        ['SUGGESTION', true, `${FEEDBACK_ENDPOINT}/feedback/stable.log`],
        ['SUGGESTION', false, `${FEEDBACK_ENDPOINT}/feedback/develop.log`],
    ] as Array<[FeedbackType, boolean, string]>)(
        '(%s, codesign=%s) → %s',
        (type, isCodesignBuild, expected) => {
            jest.spyOn(helpers, 'isCodesignBuild').mockReturnValue(isCodesignBuild);
            expect(getFeedbackUrl(type)).toBe(expected);
        },
    );
});
