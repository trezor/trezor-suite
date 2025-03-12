import { Locator, Request, expect as baseExpect } from '@playwright/test';
import { diff } from 'jest-diff';
import { isEqual } from 'lodash';

import { formatAddress, isEqualWithOmit } from '../common';
import { DevicePrompt } from '../pageObjects/devicePrompt';

type LineFormats = 'fourTetragrams' | 'fullLine';

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

const addNewlinesToAddress = (address: string, regex: RegExp, newLineFormat: string) =>
    address
        .replace(regex, match => `${match}${newLineFormat}`)
        .trim()
        .split(' ');

const transformAddress = (address: string, lineFormat: LineFormats = 'fourTetragrams') => {
    // Address is split to lines on Display so it can fit. There are different formats:
    // 1. Four tetragrams of address:
    // bc1q pyfv fvm5 2zx7
    // gek8 6ajj 5pkk ne3h
    // 385a da8r 2y
    // 1. Full lines (18 chars) of address:
    // bc1qpyfvfvm52zx7ge
    // k86ajj5pkkne3h385a
    // da8r2y
    // We want to evaluate format and existence of newlines in the address.
    const fourTetragramsOfAddress = /(\S+\s\S+\s\S+\s\S+)/g; //4 x 4 characters
    const fullLineOfAddress = /.{18}/g; //18 characters

    if (lineFormat === 'fourTetragrams') {
        return addNewlinesToAddress(formatAddress(address), fourTetragramsOfAddress, ' \n');
    }

    if (lineFormat === 'fullLine') {
        return addNewlinesToAddress(address, fullLineOfAddress, ' \n ');
    }
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

    async toDisplayReceiveAddress(
        devicePrompt: DevicePrompt,
        expectedAddress: string,
        options: { lineFormat: LineFormats; specialAccountType?: string } = {
            lineFormat: 'fourTetragrams',
        },
    ) {
        const transformedExpectedAddress = transformAddress(expectedAddress, options.lineFormat);

        let expectedContent;
        if (options.specialAccountType) {
            expectedContent = {
                header: { title: 'Receive address' },
                body: [[options.specialAccountType], transformedExpectedAddress],
                footer: 'Tap to continue',
            };
        } else {
            expectedContent = {
                header: { title: 'Receive address' },
                body: [transformedExpectedAddress],
                footer: 'Tap to continue',
            };
        }

        return await compareDisplayContent(
            devicePrompt,
            expectedContent,
            'expect Receive address to match',
        );
    },

    async toDisplayRecipientAddress(devicePrompt: DevicePrompt, expectedAddress: string) {
        const transformedExpectedAddress = transformAddress(expectedAddress);
        const expectedContent = {
            header: { title: 'Address', subtitle: 'Recipient #1' },
            body: [transformedExpectedAddress],
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
