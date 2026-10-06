import type { Branded } from '@trezor/type-utils';

// Protocol aliases are owned by network modules, so this type must stay open to new modules.
export type Protocol = string & Branded<'Protocol'>;

export const asProtocol = (protocol: string): Protocol => protocol as Protocol;
