import { Locator, Request, expect as baseExpect } from '@playwright/test';
import { diff } from 'jest-diff';

import { isEqualWithOmit } from '../common';

const compareTextAndNumber = async (
    locator: Locator,
    expectedValue: number,
    compareFn: (a: number, b: number) => boolean,
    compareFnName: string,
) => {
    await baseExpect(locator).toBeVisible();
    const text = await locator.textContent();
    const numericValue = Number(text);
    const isNumber = Number.isFinite(numericValue);

    return {
        pass: isNumber && compareFn(numericValue, expectedValue),
        message: () =>
            isNumber
                ? `expected ${numericValue} to be ${compareFnName} than ${expectedValue}`
                : `expected ${locator} to have numerical text but got '${text}'`,
    };
};

export const expect = baseExpect.extend({
    async toBeEnabledCoin(locator: Locator) {
        const isActive = await locator.getAttribute('data-active');

        return {
            pass: isActive === 'true',
            message: () =>
                isActive === null
                    ? `expected ${locator} to have attribute 'data-active', but it does not have this attribute at all`
                    : `expected ${locator} to have attribute 'data-active' set to 'true', but got '${isActive}'`,
        };
    },
    async toBeDisabledCoin(locator: Locator) {
        const isActive = await locator.getAttribute('data-active');

        return {
            pass: isActive === 'false',
            message: () =>
                isActive === null
                    ? `expected ${locator} to have attribute 'data-active', but it does not have this attribute at all`
                    : `expected ${locator} to have attribute 'data-active' set to 'false', but got '${isActive}'`,
        };
    },
    async toHaveTextGreaterThan(locator: Locator, expectedValue: number) {
        return await compareTextAndNumber(locator, expectedValue, (a, b) => a > b, 'greater');
    },
    async toHaveTextLessThan(locator: Locator, expectedValue: number) {
        return await compareTextAndNumber(locator, expectedValue, (a, b) => a < b, 'less');
    },
    async toHavePayload(
        requestPromise: Promise<Request>,
        expectedPayload: any,
        options?: { omit: string[] },
    ) {
        const requestPayload = (await requestPromise).postDataJSON();
        const isRequestPayloadMatching = isEqualWithOmit({
            object1: requestPayload,
            object2: expectedPayload,
            mask: options?.omit ?? [],
        });

        return {
            pass: isRequestPayloadMatching,
            message: () =>
                `Request payload differs from expected.
                \nDiff: ${diff(expectedPayload, requestPayload)}
                \nExpected: ${JSON.stringify(expectedPayload)}
                \nActual: ${JSON.stringify(requestPayload)}`,
        };
    },
});
