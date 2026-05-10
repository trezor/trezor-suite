import { isCodesignBuild } from '@trezor/env-utils';

import type { FeedbackType } from '../src';
import { FEEDBACK_ENDPOINT, getFeedbackUrl } from '../src/getFeedbackUrl';

jest.mock('@trezor/env-utils', () => ({
    ...jest.requireActual('@trezor/env-utils'),
    isCodesignBuild: jest.fn(),
}));

describe(getFeedbackUrl.name, () => {
    it.each([
        ['BUG', true, `${FEEDBACK_ENDPOINT}/bugs/stable.log`],
        ['BUG', false, `${FEEDBACK_ENDPOINT}/bugs/develop.log`],
        ['SUGGESTION', true, `${FEEDBACK_ENDPOINT}/feedback/stable.log`],
        ['SUGGESTION', false, `${FEEDBACK_ENDPOINT}/feedback/develop.log`],
    ] as Array<[FeedbackType, boolean, string]>)(
        '(%s, codesign=%s) → %s',
        (type, codesign, expected) => {
            (isCodesignBuild as jest.Mock).mockReturnValue(codesign);
            expect(getFeedbackUrl(type)).toBe(expected);
        },
    );
});
