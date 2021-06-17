import type { FormDraftKeyPrefix } from '@wallet-types/form';

export const getFormDraftKey = (prefix: FormDraftKeyPrefix, key: string) => `${prefix}/${key}`;
