import type { WalletDescriptor } from '@suite-common/wallet';

export type GetOwnerHasAllowance = (walletDescriptor: WalletDescriptor) => boolean;

export type GetOwnerHasAllowanceDep = {
    getOwnerHasAllowance: GetOwnerHasAllowance;
};
