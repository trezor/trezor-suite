import { DEFAULT_ACCOUNT_INCREMENT_SIZE_QUOTA, DEFAULT_DEVICE_SIZE_QUOTA } from '../../constants';
import { getAccountIncrementSizeQuota } from '../getAccountIncrementSizeQuota';

describe(getAccountIncrementSizeQuota.name, () => {
    it('should return default account size quota if unspend storage is bigger than default', () => {
        const result = getAccountIncrementSizeQuota({ unspendStorage: DEFAULT_DEVICE_SIZE_QUOTA });

        expect(result).toBe(DEFAULT_ACCOUNT_INCREMENT_SIZE_QUOTA);
    });

    it("should return remaining unspend storage if it's smaller than default account size quota", () => {
        const unspendStorage = 500;
        const result = getAccountIncrementSizeQuota({ unspendStorage });

        expect(result).toBe(unspendStorage);
    });
});
