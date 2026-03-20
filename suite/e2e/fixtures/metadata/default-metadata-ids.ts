import { createOwnerIdFromSecret } from '@suite-common/e2e-evolu-client';
import { asSuiteSyncOwnerSecretHex } from '@suite-common/suite-sync-storage';
import { asAccountDescriptor, asWalletDescriptor } from '@suite-common/wallet-types';

// Ids for default mnemonic_12: 'alcohol woman abuse must during monitor noble actual mixed trade anger aisle'
export const ownerSecret = asSuiteSyncOwnerSecretHex(
    'd5cafbfc837fcdba7fd54025ce352fac369db9383d41d73dbd4f3353b63bc4644585f41195021419707ccdf76bbdf0b1cb0e11f07ff19a41b5f22602dfee3b63',
);
export const ownerId = createOwnerIdFromSecret(ownerSecret);
export const walletDescriptor = asWalletDescriptor('mkqRFzxmkCGX9jxgpqqFHcxRUmLJcLDBer');
export const accountDescriptor = asAccountDescriptor(
    'zpub6qSSRL9wLd6LNee7qjDEuULWccP5Vbm5nuX4geBu8zMCQBWsF5Jo5UswLVxFzcbCMr2yQPG27ZhDs1cUGKVH1RmqkG1PFHkEXyHG7EV3ogY',
);
