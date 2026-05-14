import { DEFAULT_ACCOUNT_INCREMENT_SIZE_QUOTA, DEFAULT_DEVICE_SIZE_QUOTA } from '../../constants';
import { getAccountIncrementSizeQuota } from '../getAccountIncrementSizeQuota';

describe(getAccountIncrementSizeQuota.name, () => {
    it('return default account size quota if unspent storage is bigger than default', () => {
        const result = getAccountIncrementSizeQuota({ unspentStorage: DEFAULT_DEVICE_SIZE_QUOTA });

        expect(result).toBe(DEFAULT_ACCOUNT_INCREMENT_SIZE_QUOTA);
    });

    it("return remaining unspent storage if it's smaller than default account size quota", () => {
        const unspentStorage = 500;
        const result = getAccountIncrementSizeQuota({ unspentStorage });

        expect(result).toBe(unspentStorage);
    });

    it('return 0 when unspentStorage size is 0', () => {
        const unspentStorage = 0;
        const result = getAccountIncrementSizeQuota({ unspentStorage });

        expect(result).toBe(0);
    });
});
