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
