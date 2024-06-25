import { StakeType } from '@suite-common/wallet-types';

// Define signature constants
const STAKE_SIGNATURE = '0x3a29dbae';
const UNSTAKE_SIGNATURE = '0x76ec871c';
const CLAIM_SIGNATURE = '0x33986ffa';

export const signatureToStakeNameMap: { [key: string]: StakeType } = {
    [STAKE_SIGNATURE]: 'stake',
    [UNSTAKE_SIGNATURE]: 'unstake',
    [CLAIM_SIGNATURE]: 'claim',
};

export const isStakeTx = (signature: string | undefined) =>
    signature?.toLowerCase() === STAKE_SIGNATURE;

export const isUnstakeTx = (signature: string | undefined) =>
    signature?.toLowerCase() === UNSTAKE_SIGNATURE;

export const isClaimTx = (signature: string | undefined) =>
    signature?.toLowerCase() === CLAIM_SIGNATURE;

export const isStakeTypeTx = (signature: string | undefined) =>
    isStakeTx(signature) || isUnstakeTx(signature) || isClaimTx(signature);

export const getSignatureByEthereumDataHex = (dataHex: string) => `0x${dataHex.slice(0, 8)}`;

export const getTxStakeNameByDataHex = (dataHex: string | undefined): StakeType | null => {
    if (!dataHex) return null;
    const signature = getSignatureByEthereumDataHex(dataHex);

    return isStakeTypeTx(signature) ? signatureToStakeNameMap[signature] : null;
};
