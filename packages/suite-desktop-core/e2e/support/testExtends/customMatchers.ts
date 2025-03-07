import { Locator, Request, expect as baseExpect } from '@playwright/test';
import { diff } from 'jest-diff';
import { isEqual } from 'lodash';

import { isEqualWithOmit } from '../common';
import { DevicePrompt } from '../pageObjects/devicePrompt';

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

const compareDisplayContent = async (
    devicePrompt: DevicePrompt,
    expectedContent: any,
    errorMessage: string,
) => {
    const content = await devicePrompt.getDisplayContent();

    return {
        pass: isEqual(expectedContent, content),
        message: () => `${errorMessage}. Diff:\n${diff(expectedContent, content)}`,
    };
};

const transformAddressToArrayWithNewlines = (address: string) => {
    // Address is split to lines of 4 parts on Display so it can fit.
    // We want to evaluate existence of newlines in the address.
    const fourPartsOfAddress = /(\S+\s\S+\s\S+\s\S+)/g;

    return address.replace(fourPartsOfAddress, '$1 \n').trim().split(' ');
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

    async toDisplayReceiveAddress(devicePrompt: DevicePrompt, expectedAddress: string) {
        const expectedAddressWithNewlines = transformAddressToArrayWithNewlines(expectedAddress);
        const expectedContent = {
            header: { title: 'Receive address' },
            body: [expectedAddressWithNewlines],
            footer: 'Swipe up',
        };

        return await compareDisplayContent(
            devicePrompt,
            expectedContent,
            'expect Receive address to match',
        );
    },

    async toDisplayRecipientAddress(devicePrompt: DevicePrompt, expectedAddress: string) {
        const expectedAddressWithNewlines = transformAddressToArrayWithNewlines(expectedAddress);
        const expectedContent = {
            header: { title: 'Address', subtitle: 'Recipient #1' },
            body: [expectedAddressWithNewlines],
            footer: 'Swipe up',
        };

        return await compareDisplayContent(
            devicePrompt,
            expectedContent,
            'expect Recipient address to match',
        );
    },

    async toDisplaySummary(devicePrompt: DevicePrompt, totalAmount: string, feeAmount: string) {
        const expectedContent = {
            header: { title: 'Summary' },
            body: [['Total amount'], [totalAmount], [' '], ['incl. Transaction fee'], [feeAmount]],
            footer: 'Swipe up',
        };

        return await compareDisplayContent(
            devicePrompt,
            expectedContent,
            'expect Summary to match',
        );
    },
});
