import { Locator, expect as baseExpect } from '@playwright/test';

async function checkVisibilityAndNumericValue(locator: Locator) {
    const isVisible = await locator.isVisible();
    if (!isVisible) {
        return { pass: false, message: () => `expected ${locator} to be visible` };
    }

    const text = await locator.textContent();
    if (!Number.isFinite(Number(text))) {
        return {
            pass: false,
            message: () => `expected ${locator} to have numerical text but got '${text}'`,
        };
    }

    return { pass: true, message: () => `passed` };
}

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
        const { pass, message } = await checkVisibilityAndNumericValue(locator);
        if (!pass) {
            return { pass, message };
        }

        const numericValue = Number(await locator.textContent());

        return {
            pass: numericValue > expectedValue,
            message: () => `expected ${numericValue} to be greater than ${expectedValue}`,
        };
    },
    async toHaveTextLessThan(locator: Locator, expectedValue: number) {
        const { pass, message } = await checkVisibilityAndNumericValue(locator);
        if (!pass) {
            return { pass, message };
        }

        const numericValue = Number(await locator.textContent());

        return {
            pass: numericValue < expectedValue,
            message: () => `expected ${numericValue} to be less than ${expectedValue}`,
        };
    },
});
