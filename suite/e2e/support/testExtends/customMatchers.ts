import { createIntl, createIntlCache } from 'react-intl';

import { Locator, Request, expect as baseExpect, test } from '@playwright/test';
import { diff } from 'jest-diff';
import { isEqual } from 'lodash';

import { TranslationKey } from '@trezor/suite/src//components/suite/Translation';
import messages from '@trezor/suite/src//support/messages';

import { formatAddress, isEqualWithOmit, normalizeWhitespace } from '../common';
import { DevicePrompt } from '../pageObjects/devicePrompt';

type LineFormats = 'fourTetragrams' | 'evmTetragrams' | 'fullLine';

const DISPLAY_CHAR_LIMIT = 18;
const STRING_UP_TO_DISPLAY_LIMIT = new RegExp(`.{1,${DISPLAY_CHAR_LIMIT}}`, 'g');
const intlEn = createIntl({ locale: 'en', messages: {} }, createIntlCache());

const compareTextAndNumber = async (
    locator: Locator,
    expectedValue: number,
    compareFn: (a: number, b: number) => boolean,
    compareFnName: string,
) => {
    await baseExpect(locator).toBeVisible();
    const text = await locator.textContent();
    const textWithoutEllipsis = text?.endsWith('…') ? text.slice(0, -1) : text;
    const numericValue = Number(textWithoutEllipsis);
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
    await test.step(`expected object: ${JSON.stringify(expectedContent)}`, () => {});
    const contentRaw = await devicePrompt.getDisplayContent();
    const content = normalizeWhitespace(contentRaw);
    const debugInfo = JSON.stringify(await devicePrompt.getAnalyzedDisplayContent(), null, 2);

    return {
        pass: isEqual(expectedContent, content),
        message: () =>
            `${errorMessage}. Diff:\n${diff(expectedContent, content)}\n\nAnalysis:\n${debugInfo}`,
    };
};

const addNewlinesToAddress = (address: string, regex: RegExp, newLineFormat: string) =>
    address
        .replace(regex, match => `${match}${newLineFormat}`)
        .trim()
        .split(' ');

const formatEvmAddress = (address: string) => {
    if (!address.startsWith('0x')) {
        return formatAddress(address);
    }

    const tetragrams = address.slice(2).match(/.{1,4}/g);

    if (!tetragrams) {
        return address;
    }

    const [firstTetragram, ...rest] = tetragrams;

    return ['0x' + firstTetragram, ...rest].join(' ');
};

export const transformAddress = (address: string, lineFormat: LineFormats = 'fourTetragrams') => {
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

    if (lineFormat === 'fourTetragrams') {
        return addNewlinesToAddress(formatAddress(address), fourTetragramsOfAddress, ' \n');
    }

    if (lineFormat === 'evmTetragrams') {
        return addNewlinesToAddress(formatEvmAddress(address), fourTetragramsOfAddress, ' \n');
    }

    if (lineFormat === 'fullLine') {
        return addNewlinesToAddress(address, STRING_UP_TO_DISPLAY_LIMIT, ' \n ');
    }
};

export const splitStringByDisplayLimit = (text: string) => {
    const splitLines = text.match(STRING_UP_TO_DISPLAY_LIMIT);
    if (!splitLines) {
        throw new Error(`Failed to split text into lines: "${text}"`);
    }

    // Add a newline item into array after each item except the last one
    return splitLines.flatMap((line, index) =>
        index < splitLines.length - 1 ? [line.trim(), '\n'] : [line.trim()],
    );
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
        if (devicePrompt.getDeviceModel() !== 'T3T1') {
            return { pass: true, message: () => 'Test is skipped on non-T3T1 models' };
        }
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

    async toDisplayOnEmulator(devicePrompt: DevicePrompt, expectedContent: object) {
        if (devicePrompt.getDeviceModel() !== 'T3T1') {
            return { pass: true, message: () => 'Test is skipped on non-T3T1 models' };
        }

        return await compareDisplayContent(
            devicePrompt,
            expectedContent,
            'expect Emulator display to match',
        );
    },

    toContainSubObject(superObject: any, subObject: any) {
        return {
            pass: baseExpect.objectContaining(subObject).asymmetricMatch(superObject),
            message: () =>
                `expected superObject to have subObject. Diff:\n${diff(subObject, superObject)}`,
        };
    },

    async toHaveTranslation(
        locator: Locator,
        translationKey: TranslationKey,
        // Use ICU values for placeholders (e.g., { amount, symbol, days })
        options?: {
            isValueElement?: boolean;
            values?: Record<string, string | number>;
            timeout?: number;
        },
    ) {
        const template = messages[translationKey].defaultMessage;
        const values = options?.values;
        const expectedTranslation =
            values && Object.keys(values).length > 0
                ? String(
                      intlEn.formatMessage(
                          { id: translationKey, defaultMessage: template },
                          options.values,
                      ),
                  )
                : template;

        if (options?.isValueElement) {
            await baseExpect(locator).toHaveValue(expectedTranslation, {
                timeout: options?.timeout,
            });
        } else {
            await baseExpect(locator).toHaveText(expectedTranslation, {
                timeout: options?.timeout,
            });
        }

        return {
            pass: true,
            message: () => 'errors are handled in expects above',
        };
    },

    async toContainTranslation(
        locator: Locator,
        translationKey: TranslationKey,
        // Use ICU values for placeholders (e.g., { amount, symbol, days })
        options?: {
            isValueElement?: boolean;
            values?: Record<string, string | number>;
            timeout?: number;
        },
    ) {
        const template = messages[translationKey].defaultMessage;
        const values = options?.values;
        const expectedTranslation =
            values && Object.keys(values).length > 0
                ? String(
                      intlEn.formatMessage(
                          { id: translationKey, defaultMessage: template },
                          options.values,
                      ),
                  )
                : template;
        if (options?.isValueElement) {
            await baseExpect
                .poll(async () => await locator.inputValue(), {
                    timeout: options?.timeout,
                })
                .toContain(expectedTranslation);
        } else {
            await baseExpect(locator).toContainText(expectedTranslation, {
                timeout: options?.timeout,
            });
        }

        return {
            pass: true,
            message: () => 'errors are handled in expects above',
        };
    },
});
