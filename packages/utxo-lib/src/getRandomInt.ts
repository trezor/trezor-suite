import { randomBytes } from 'crypto';

const MAX_32_BIT_INT = 0x100000000;

/**
 * Before changing anything here, see the Modulo Bias problem!
 * @see https://research.kudelskisecurity.com/2020/07/28/the-definitive-guide-to-modulo-bias-and-how-to-avoid-it/
 *
 * @param min Inclusive
 * @param max Exclusive
 */
export const getRandomInt = (min: number, max: number) => {
    if (!Number.isSafeInteger(min)) {
        throw new RangeError(
            `The "min" argument must be a safe integer. Received type ${typeof min} (${min})`,
        );
    }

    if (!Number.isSafeInteger(max)) {
        throw new RangeError(
            `The "max" argument must be a safe integer. Received type ${typeof max} (${max})`,
        );
    }

    if (min >= max) {
        throw new RangeError(
            `The value of "max" is out of range. It must be greater than the value of "min" (${min}). Received ${max}`,
        );
    }

    if (max - min > MAX_32_BIT_INT) {
        throw new RangeError(
            `This function only provide 32 bits of entropy, therefore range cannot be more then 2^32.`,
        );
    }

    // This 4 bytes provide 32 bits of entropy, therefore the range of random number
    // is limited to 2^32.
    //
    // If you need to change this, you need to use more bytes and handle the modulo bias.
    // See: https://research.kudelskisecurity.com/2020/07/28/the-definitive-guide-to-modulo-bias-and-how-to-avoid-it/

    const randomValue = randomBytes(4).readUInt32LE() / MAX_32_BIT_INT;

    return Math.floor(min + randomValue * (max - min));
};
