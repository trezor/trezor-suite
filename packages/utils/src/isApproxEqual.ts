import { BigNumber, BigNumberValue } from './bigNumber';

/**
 * Check if two BigNumber values are approximately equal based on relative difference
 * @param value1
 * @param value2
 * @param relativeTolerance maximum threshold for relative difference of values to declare them approx. equal
 */
export const isApproxEqual = (
    value1: BigNumberValue,
    value2: BigNumberValue,
    relativeTolerance: BigNumberValue,
): boolean => {
    value1 = new BigNumber(value1);
    value2 = new BigNumber(value2);
    relativeTolerance = new BigNumber(relativeTolerance);

    // Cannot calculate relative difference if one value is zero, but then they must be equal
    if (value1.eq(0)) return value1.eq(value2);

    const relativeDifference = value2.minus(value1).abs().dividedBy(value1);

    return relativeDifference.lte(relativeTolerance);
};
