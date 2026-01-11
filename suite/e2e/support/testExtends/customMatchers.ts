import { createIntl, createIntlCache } from 'react-intl';

import { Locator, Request, expect as baseExpect, test } from '@playwright/test';
import { diff } from 'jest-diff';
import { isEqualWith } from 'lodash';

import { TranslationKey } from '@trezor/suite/src//components/suite/Translation';
import messages from '@trezor/suite/src//support/messages';

import { formatAddress, isEqualWithOmit, normalizeWhitespace } from '../common';
import type { NormalizedDisplayContent } from '../helpers/displayContentNormalizedParser';
import { DevicePrompt } from '../pageObjects/devicePrompt';

type LineFormats = 'fourTetragrams' | 'evmTetragrams' | 'fullLine';

const DISPLAY_CHAR_LIMIT_T3T1 = 18;
const STRING_UP_TO_T3T1_DISPLAY_LIMIT = new RegExp(`.{1,${DISPLAY_CHAR_LIMIT_T3T1}}`, 'g');
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
    expectedContent: NormalizedDisplayContent,
    errorMessage: string,
) => {
    await test.step(`expected object: ${JSON.stringify(expectedContent)}`, () => {});
    const contentRaw = await devicePrompt.getDisplayContent();
    const content = normalizeWhitespace(contentRaw);
    const debugInfo = JSON.stringify(await devicePrompt.getAnalyzedDisplayContent(), null, 2);

    const regexAndStringComparator = (expectedValue: any, actualValue: any) => {
        if (expectedValue instanceof RegExp && typeof actualValue === 'string') {
            return expectedValue.test(actualValue);
        }

        // Let default comparison handle all other cases
        return undefined;
    };

    return {
        pass: isEqualWith(expectedContent, content, regexAndStringComparator),
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
    // 2. EVM tetragrams of address:
    // 0x12as 34ab cdef 5678
    // 9abc def0 1234 5678
    // 9abc def0
    // 3. Full lines (18 chars) of address:
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
        return addNewlinesToAddress(address, STRING_UP_TO_T3T1_DISPLAY_LIMIT, ' \n ');
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
        options: { lineFormat: LineFormats } = {
            lineFormat: 'fourTetragrams',
        },
    ) {
        const transformedExpectedAddress = transformAddress(expectedAddress, options.lineFormat);
        const expectedContent = devicePrompt.model.isT3W1()
            ? {
                  header: { title: 'Receive' },
                  body: [transformedExpectedAddress],
                  actions: {
                      right_button: 'Confirm',
                  },
              }
            : {
                  header: { title: 'Receive address' },
                  body: [transformedExpectedAddress],
                  footer: 'Tap to continue',
              };

        return await compareDisplayContent(
            devicePrompt,
            expectedContent,
            'expect Receive address to match',
        );
    },

    async toDisplayOnEmulator(
        devicePrompt: DevicePrompt,
        expected: { T3W1: NormalizedDisplayContent; T3T1?: Partial<NormalizedDisplayContent> },
    ) {
        // default T3W1 model
        let expectedContent = expected.T3W1;

        // expected.T3T1 is used as overrides for the default T3W1 model
        if (!devicePrompt.model.isT3W1()) {
            const DEFAULT_T3T1_FOOTER = { footer: 'Tap to continue' };
            expectedContent = {
                ...expected.T3W1,
                ...DEFAULT_T3T1_FOOTER,
                ...expected.T3T1,
            };

            // Remove footer if T3T1 override explicitly says it is undefined
            const noFooterExpected = !expectedContent.footer;
            if (noFooterExpected) {
                delete expectedContent.footer;
            }

            // nonT3W1 does not have actions, remove them
            delete expectedContent.actions;
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

    async toHaveLoadedImage(locator: Locator, options?: { timeout?: number }) {
        await baseExpect(locator).toBeVisible({ timeout: options?.timeout });
        await baseExpect
            .poll(
                async () =>
                    await locator.evaluate(
                        (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
                    ),
                {
                    timeout: options?.timeout,
                    message:
                        'expected locator to have image loaded but naturalWidth is 0 or complete is false',
                },
            )
            .toBe(true);

        return {
            message: () => 'passed',
            pass: true,
        };
    },
});
