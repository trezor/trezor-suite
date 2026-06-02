import { type Branded } from '@trezor/type-utils';

/**
 * First testnet address => 44/1/0/0/0
 *
 * See `packages/connect/src/device/workflow/validateState.ts` where it is retrieved
 */
export type WalletDescriptor = string & Branded<'WalletDescriptor'>;

export const asWalletDescriptor = (value: string) => value as WalletDescriptor;
