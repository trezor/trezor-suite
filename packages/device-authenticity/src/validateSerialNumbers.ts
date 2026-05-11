import { isNotNull } from '@trezor/utils';

import { type ResultsToValidate } from './types';

const failAllResults = ({
    optigaResult,
    tropicResult,
    mcuResult,
}: ResultsToValidate): ResultsToValidate => ({
    optigaResult: {
        ...optigaResult,
        valid: false,
        error: 'SERIAL_NUMBER_MISMATCH',
    },

    tropicResult: tropicResult
        ? { ...tropicResult, valid: false, error: 'SERIAL_NUMBER_MISMATCH' }
        : null,

    mcuResult: mcuResult ? { ...mcuResult, valid: false, error: 'SERIAL_NUMBER_MISMATCH' } : null,
});

/**
 * Validates that serial numbers are consistent across authentication results.
 * If any result has valid: false, returns all as-is.
 * It compares serialNumbers for all non-null results, and returns all as-is if they all match.
 * If any of them doesn't match, it sets all of them to valid: false with SERIAL_NUMBER_MISMATCH error.
 * Assumption: if any of the result is null, it's only because the device doesn't support the method
 * (see connect authenticateDevice: if device is capable but omits result, it returns failure with RESPONSE_PAYLOAD_MISSING ).
 */
export const validateSerialNumbers = (resultsToValidate: ResultsToValidate): ResultsToValidate => {
    const { optigaResult, tropicResult, mcuResult } = resultsToValidate;

    const availableResults = [optigaResult, tropicResult, mcuResult].filter(isNotNull);
    // Cannot happen, see authenticateDevice, there'll always be at least failed optigaResult (it's always required).
    if (availableResults.length === 0) return resultsToValidate;

    // If any result has failed, it already means DAC has failed as a whole, so return all as they are.
    const anyInvalid = availableResults.some(({ valid }) => !valid);
    if (anyInvalid) return resultsToValidate;

    // Check that all have defined serialNumber
    const allHaveSerialNumber = availableResults.every(
        ({ serialNumber }) => typeof serialNumber === 'string' && serialNumber.length > 0,
    );
    if (!allHaveSerialNumber) return failAllResults(resultsToValidate);

    // Check that all serial numbers are equal
    const first = availableResults[0].serialNumber!;
    const allEqual = availableResults.every(({ serialNumber }) => serialNumber === first);
    if (!allEqual) return failAllResults(resultsToValidate);

    // All validations passed
    return resultsToValidate;
};
