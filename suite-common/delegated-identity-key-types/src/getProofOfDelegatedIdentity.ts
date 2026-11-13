/**
 * This may happen in case of data in Redux are corrupted,
 * or when the P-256 curve code fails to load.
 *
 * For example: when we introduced SafeStorage encryption
 * and users (only developers & tested, ATM) have non-encrypted
 * data in Redux, or we change the encryption method.
 */
export type ProofOfDelegatedSignFailedType = {
    type: 'ProofOfDelegatedSignFailed';
    caused: unknown;
};
