import { createIntl, createIntlCache } from 'react-intl';

import test, { Locator, Page, TestInfo, expect } from '@playwright/test';
import { isEqual, omit } from 'lodash';
import { readdirSync } from 'node:fs';
import path from 'node:path';

import { validJws } from '@suite-common/message-system/src/__fixtures__/messageSystemActions';
import { type TradingCountryCode, regional } from '@suite-common/trading';
import { getAccountDecimals, localizeNumber } from '@suite-common/wallet-utils';
import { BigNumber, splitStringEveryNCharacters } from '@trezor/utils';

import { PlaywrightTarget } from './testExtends/suiteTestOptions';
import { PercentageOfBalanceParams } from './types';

export const isDesktopProject = (target: PlaywrightTarget) => target === PlaywrightTarget.Desktop;

export const isWebProject = (target: PlaywrightTarget) => target === PlaywrightTarget.Web;

export const getUrl = (testInfo: TestInfo, target: PlaywrightTarget) => {
    const electronApiURL = 'file:///';
    const apiURL = isDesktopProject(target) ? electronApiURL : testInfo.project.use.baseURL;
    if (!apiURL) {
        throw new Error('apiURL is not defined');
    }

    return apiURL;
};

// Wraps whole page object methods with test.step
export function step(stepName?: string) {
    /* eslint-disable @typescript-eslint/no-unsafe-function-type */
    return function decorator(target: Function, context: ClassMethodDecoratorContext) {
        return function replacementMethod(this: any, ...args: any) {
            const result = target.call(this, ...args);

            // Only wrap async results in test.step. Wrapping synchronous methods could introduce
            // race conditions, so we return their result untouched.
            if (result instanceof Promise) {
                const name =
                    stepName || `${this.constructor.name + '.' + (context.name as string)}`;
                const params = args.map((arg: any) => JSON.stringify(arg)).join(', '); // Serialize arguments

                return test.step(`${name}(${params})`, async () => await result);
            }

            return result;
        };
    };
    /* eslint-enable @typescript-eslint/no-unsafe-function-type */
}

export const isEqualWithOmit = (param: { object1: any; object2: any; mask: string[] }) =>
    isEqual(omit(param.object1, param.mask), omit(param.object2, param.mask));

export const formatAddress = (address: string) => splitStringEveryNCharacters(address, 4).join(' ');

const REGEXP_ADDRESS_CHUNKS = /((?:\S+\s){3}\S+)\s/g;
const EVM_ADDRESS_PREFIX = '0x';
export const DEVICE_RENDERED_EVM_INDENT = '  ';

export const formatEvmAddress = (address: string) => {
    if (!address.startsWith(EVM_ADDRESS_PREFIX)) {
        return formatAddress(address);
    }

    const spacedBody = splitStringEveryNCharacters(address.slice(2), 4).join(' ');

    if (!spacedBody) {
        return address;
    }

    return `${DEVICE_RENDERED_EVM_INDENT}${EVM_ADDRESS_PREFIX} ${spacedBody}`;
};

export const formatAddressWithNewlines = (address: string) =>
    formatEvmAddress(address).replace(REGEXP_ADDRESS_CHUNKS, '$1\n');

// This overrides any auto fixture in tests that opt out of it; the skipped value is undefined, so
// consumers of an optional fixture must guard against it (e.g. watcher?.stop()).
/* eslint-disable react-hooks/rules-of-hooks */
export async function skipFixture<T = void>({}, use: (fixture: T | undefined) => Promise<void>) {
    await use(undefined);
}
/* eslint-enable react-hooks/rules-of-hooks */

export const getVideoPath = (videoFolder: string): string | false => {
    const videoFilenames = readdirSync(videoFolder).filter(file => file.endsWith('.webm'));
    if (videoFilenames.length < 1) {
        console.error(
            `Test teardown error: No test video files found in the output directory: ${videoFolder}`,
        );

        return false;
    }

    if (videoFilenames.length > 1) {
        console.warn(
            `Test teardown warning: Multiple test video files found in the output directory: ${videoFilenames}.\nUsing the first one: ${videoFilenames[0]}`,
        );
    }

    return path.join(videoFolder, videoFilenames[0] ?? '');
};

export const getCountryLabel = (country: TradingCountryCode) => {
    const countryOption = regional.countriesOptionsMap.get(country);
    if (!countryOption) {
        throw new Error(`Country ${country} not found in the countries map`);
    }

    return countryOption.label.substring(countryOption.label.indexOf(' ') + 1);
};

export const calculatePercentageOfBalance = (params: PercentageOfBalanceParams) => {
    const fraction = (parseFloat(params.balance) * params.percentage) / 100;
    const maxDecimals = getAccountDecimals(params.symbol);

    return localizeNumber(fraction, 'en-US', 0, maxDecimals);
};

export const countDecimalPlaces = (value: string | number) => {
    if (typeof value === 'string' && isNaN(Number(value))) {
        throw new Error('Value is not a valid number string');
    }

    return value.toString().split('.')[1]?.length ?? 0;
};

export const getBigNumberFromBalance = async (locator: Locator) => {
    await expect(locator).toHaveText(/\d/);
    let originalBalanceText = await locator.innerText();
    const hasEllipsis = originalBalanceText.includes('…');
    if (hasEllipsis) {
        originalBalanceText = originalBalanceText.slice(0, -1);
    }

    const originalBalance = BigNumber(originalBalanceText);

    return { originalBalance, hasEllipsis };
};

/**
 * Mocks remote message-system with an empty JWS config signed by develop key.
 */
export const mockRemoteMessageSystem = async (page: Page): Promise<void> => {
    await page.route('**/config.v1.jws', async route => {
        await route.fulfill({ status: 200, body: validJws });
    });
};

export const normalizeWhitespace = (obj: any): any => {
    if (typeof obj === 'string') {
        // Normalize whitespace: \u00A0 is non-breaking space, \u0020 is regular space.
        return obj.replace(/[\u00A0\u0020]/g, ' ');
    }
    if (Array.isArray(obj)) {
        return obj.map(normalizeWhitespace);
    }
    if (obj && typeof obj === 'object') {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = normalizeWhitespace(value);
        }

        return result;
    }

    return obj;
};

export const analyzeObject = (obj: any): any => {
    const padding = 3; // Padding for character codes
    const analyzeText = (text: string) => {
        const chars = Array.from(text);
        const paddedChars = chars.map(char => char.padStart(padding, ' '));
        const paddedCodes = chars.map(char => char.charCodeAt(0).toString().padStart(padding, ' '));

        return {
            chars: paddedChars.join(' '),
            codes: paddedCodes.join(' '),
        };
    };

    if (typeof obj === 'string') {
        return analyzeText(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(analyzeObject);
    }
    if (obj && typeof obj === 'object') {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = analyzeObject(value);
        }

        return result;
    }

    return obj;
};

export const sanitizeAndStringifyLogFields = (fields: Record<string, unknown>) =>
    JSON.stringify(
        Object.fromEntries(
            Object.entries(fields).map(([key, value]) => [
                key,
                typeof value === 'undefined' ? 'warning: undefined' : value,
            ]),
        ),
        null,
        2,
    );

export const toADA = (lovelace: number, options?: { maxDecimals?: number }) =>
    `${localizeNumber(lovelace / 1000000, 'en-US', 0, options?.maxDecimals ?? 6)} ADA`;

export const replaceTemplatesInTranslation = (
    template: string,
    values: Record<string, string | number>,
) => {
    const intlEn = createIntl({ locale: 'en', messages: {} }, createIntlCache());

    return intlEn.formatMessage({ id: template, defaultMessage: template }, values);
};
