import zxcvbn from 'zxcvbn';

// these utils are meant to normalize results for various types of inputs

/**
 * Wrapper around zxcvbn module. No added logic here
 */
export const getPassphraseStrengthScore = (passphrase: string) => {
    if (!passphrase) return;
    // first 50 chars is perfectly OK as it is maximum length of passphrase. And it saves CPU time!
    return zxcvbn(passphrase.substr(0, 50)).score;
};

/**
 * Pin strength score returns the same result as getPassphraseStrengthScore. But it (probably)
 * can not use zxcvbn module directly because it is not possible to get the highest score
 * for PIN input of maximum complexity (9 random digits).
 */
export const getPinStrengthScore = (pin: string) => {
    if (!pin) return;
    return zxcvbn(pin.substr(0, 9)).score;
};
