import { Locator, expect as baseExpect } from '@playwright/test';

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
});
