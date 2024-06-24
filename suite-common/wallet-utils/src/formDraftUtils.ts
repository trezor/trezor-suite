import type { FormDraftKeyPrefix } from '@suite-common/wallet-types';

export const getFormDraftKey = (prefix: FormDraftKeyPrefix, key: string) => `${prefix}/${key}`;

export const parseFormDraftKey = (
    formDraftKey: string,
): [prefix: FormDraftKeyPrefix, key: string] => {
    const delimiterIndex = formDraftKey.indexOf('/');
    if (delimiterIndex < 0) {
        throw Error('Invalid formDraftKey');
    }
    const prefix = formDraftKey.slice(0, delimiterIndex);
    const key = formDraftKey.slice(delimiterIndex + 1);

    return [prefix as FormDraftKeyPrefix, key];
};
