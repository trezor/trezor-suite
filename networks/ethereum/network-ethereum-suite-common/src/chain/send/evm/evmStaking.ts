export type EvmStakeType = 'stake' | 'unstake' | 'claim';

const STAKE_SIGNATURE = '0x3a29dbae';
const UNSTAKE_SIGNATURE = '0x76ec871c';
const CLAIM_SIGNATURE = '0x33986ffa';

export const signatureToStakeTypeMap: { [key: string]: EvmStakeType } = {
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

export const getSignatureByEthereumDataHex = (dataHex: string) => {
    const cleanHex = dataHex.startsWith('0x') ? dataHex.slice(2) : dataHex;

    return `0x${cleanHex.slice(0, 8)}`;
};

/** The staking pool call the transaction data makes, if it is one. */
export const getTxStakeNameByDataHex = (dataHex: string | undefined): EvmStakeType | null => {
    if (!dataHex) return null;
    const signature = getSignatureByEthereumDataHex(dataHex);

    if (!isStakeTypeTx(signature)) return null;
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const stakeType: EvmStakeType = signatureToStakeTypeMap[signature];

    return stakeType;
};
