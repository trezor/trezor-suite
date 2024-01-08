export const isStakeTx = (signature: string | undefined) => {
    if (!signature) return false;

    // Stake, unstake, claim accordingly
    const stakeTxSignatures = ['0x3a29dbae', '0x76ec871c', '0x33986ffa'];
    return stakeTxSignatures.includes(signature);
};
