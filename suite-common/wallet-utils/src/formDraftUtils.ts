import type { FormDraftKeyPrefix } from '@suite-common/wallet-types';

export const getFormDraftKey = (prefix: FormDraftKeyPrefix, key: string) => `${prefix}/${key}`;

export const parseFormDraftKey = (
    formDraftKey: string,
): [prefix: FormDraftKeyPrefix, key: string] => {
    const strings = formDraftKey.split('/');
    if (strings.length === 2) {
        return strings as [prefix: FormDraftKeyPrefix, key: string];
    }
    throw Error('Invalid formDraftKey');
};
