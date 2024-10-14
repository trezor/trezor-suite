import { randomBytes } from 'crypto';

export const getRandomInt = (min: number, max: number) => {
    const randomValue = parseInt(randomBytes(4).toString('hex'), 16);

    return min + (randomValue % (max - min + 1));
};
