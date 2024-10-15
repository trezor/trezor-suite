import { randomBytes } from 'crypto';

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

    const randomValue = parseInt(randomBytes(4).toString('hex'), 16);

    return min + (randomValue % (max - min));
};
