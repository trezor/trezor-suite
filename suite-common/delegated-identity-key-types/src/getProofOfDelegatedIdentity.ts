/**
 * This may happen in case of data in Redux are corrupted.
 *
 * For example: when we introduced SafeStorage encryption
 * and users (only developers & tested, ATM) have non-encrypted
 * data in Redux, or we change the encryption method.
 */
export type ProofOfDelegatedSignFailedType = {
    type: 'ProofOfDelegatedSignFailed';
    caused: unknown;
};
