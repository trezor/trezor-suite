import type { WalletDescriptor } from '@trezor/device-utils';

export type GetOwnerHasAllowance = (walletDescriptor: WalletDescriptor) => boolean;

export type GetOwnerHasAllowanceDep = {
    getOwnerHasAllowance: GetOwnerHasAllowance;
};
