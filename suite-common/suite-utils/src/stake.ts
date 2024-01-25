export const isStakeTx = (signature: string | undefined) => {
    if (!signature) return false;

    // Stake signature
    return signature === '0x3a29dbae';
};

export const isClaimTx = (signature: string | undefined) => {
    if (!signature) return false;

    // Claim signature
    return signature === '0x33986ffa';
};

export const isStakeTypeTx = (signature: string | undefined) => {
    if (!signature) return false;

    // 0x76ec871c - Unstake signature
    return isStakeTx(signature) || signature === '0x76ec871c' || isClaimTx(signature);
};
