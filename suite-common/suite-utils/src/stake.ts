import { hexToNumberString } from 'web3-utils';

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

export const getUnstakeAmountByEthereumDataHex = (dataHex?: string) => {
    if (!dataHex) return null;

    // Check if the first two characters are '0x' and remove them if they are
    const data = dataHex.startsWith('0x') ? dataHex.slice(2) : dataHex;

    const signature = getSignatureByEthereumDataHex(data);
    if (!isUnstakeTx(signature)) return null;

    const dataBuffer = Buffer.from(data, 'hex');

    return hexToNumberString(`0x${dataBuffer.subarray(4, 36).toString('hex')}`);
};
