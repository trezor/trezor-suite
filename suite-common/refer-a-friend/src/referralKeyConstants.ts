import { type CipherKeyValue } from '@trezor/connect';

/**
 * Parameters of the referral key derivation on the device. The key text (shown on the device),
 * the value and all flags are inputs of the derivation, so changing any of them changes the
 * referral account of every user. They must stay fixed forever.
 * The path is shared with legacy labeling, the different key text makes the output unrelated.
 */
export const REFERRAL_KEY_CIPHER_PARAMS: CipherKeyValue = {
    path: "m/10015'/0'",
    key: 'Join Refer a Friend?',
    value: 'fc68e5e516b5eb2f5c4a1601c2802626872b9170ceb6b1ca5b1f7c5364838a35',
    encrypt: true,
    askOnEncrypt: true,
    askOnDecrypt: true,
};
