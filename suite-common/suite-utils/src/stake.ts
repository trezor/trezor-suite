import { StakeType } from '@suite-common/wallet-types';

export const isStakeTx = (signature: string | undefined) => {
    if (!signature) return false;

    // Stake signature
    return signature === '0x3a29dbae';
};

export const isUnstakeTx = (signature: string | undefined) => {
    if (!signature) return false;

    // Unstake signature
    return signature === '0x76ec871c';
};

export const isClaimTx = (signature: string | undefined) => {
    if (!signature) return false;

    // Claim signature
    return signature === '0x33986ffa';
};

export const isStakeTypeTx = (signature: string | undefined) => {
    if (!signature) return false;

    return isStakeTx(signature) || isUnstakeTx(signature) || isClaimTx(signature);
};

export const signatureToStakeNameMap: { [key: string]: StakeType } = {
    '0x3a29dbae': 'stake',
    '0x76ec871c': 'unstake',
    '0x33986ffa': 'claim',
};

export const getSignatureByEthereumDataHex = (dataHex: string) => {
    const signature = '0x' + dataHex.slice(0, 8);

    return signature;
};

export const selectTxStakeNameByDataHex = (dataHex: string | undefined): StakeType | null => {
    if (!dataHex) return null;
    const signature = getSignatureByEthereumDataHex(dataHex);

    return isStakeTypeTx(signature) ? signatureToStakeNameMap[signature] : null;
};
