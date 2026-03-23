import { isCodesignBuild } from '@trezor/env-utils';

import { type FeedbackType } from './feedback';

export const FEEDBACK_ENDPOINT = 'https://data.trezor.io/suite';

export const getFeedbackUrl = (type: FeedbackType) => {
    const typeUri = type === 'BUG' ? 'bugs' : 'feedback';
    const base = `${FEEDBACK_ENDPOINT}/${typeUri}`;

    if (isCodesignBuild()) {
        return `${base}/stable.log`;
    }

    return `${base}/develop.log`;
};
