import type { FormDraftKeyPrefix } from '@suite-common/wallet-types';

export const getFormDraftKey = (prefix: FormDraftKeyPrefix, key: string) => `${prefix}/${key}`;
