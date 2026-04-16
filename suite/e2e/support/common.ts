import test, { Locator, Page, TestInfo } from '@playwright/test';
import { isEqual, omit } from 'lodash';
import { readdirSync } from 'node:fs';
import path from 'node:path';

import { validJws } from '@suite-common/message-system/src/__fixtures__/messageSystemActions';
import { TradingCountryCode, regional } from '@suite-common/trading';
import { getAccountDecimals, localizeNumber } from '@suite-common/wallet-utils';
import { Model } from '@trezor/trezor-user-env-link';
import { BigNumber, splitStringEveryNCharacters } from '@trezor/utils';

import { PlaywrightTarget } from './testExtends/suiteTestOptions';
import { PercentageOfBalanceParams } from './types';
import releases from '../../../submodules/trezor-common/releases.json';

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
            const name = stepName || `${this.constructor.name + '.' + (context.name as string)}`;
            const params = args.map((arg: any) => JSON.stringify(arg)).join(', '); // Serialize arguments

            return test.step(`${name}(${params})`, async () => await target.call(this, ...args));
        };
    };
    /* eslint-enable @typescript-eslint/no-unsafe-function-type */
}

export const isEqualWithOmit = (param: { object1: any; object2: any; mask: string[] }) =>
    isEqual(omit(param.object1, param.mask), omit(param.object2, param.mask));

export const formatAddress = (address: string) => splitStringEveryNCharacters(address, 4).join(' ');

const REGEXP_ADDRESS_CHUNKS = /((?:\S+\s){3}\S+)\s/g;
const EVM_ADDRESS_PREFIX = '0x';
const DEVICE_RENDERED_EVM_INDENT = '  ';

const formatEvmAddress = (address: string) => {
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

// This function is used to override automatic fixtures that we want to skip in specific tests.
/* eslint-disable react-hooks/rules-of-hooks */
export async function skipFixture({}, use: (r: void) => Promise<void>) {
    await use();
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

export const findLatestVersionForModel = (model: Model): string => {
    const firmwareVersions = releases.firmware;
    const versions = Object.keys(firmwareVersions);

    // Sort versions in descending order
    versions.sort((a, b) => (a > b ? -1 : 1));

    // Find the latest version supporting our model
    for (const version of versions) {
        if (firmwareVersions[version as keyof typeof firmwareVersions].includes(model)) {
            return version;
        }
    }

    throw new Error(`No firmware version found for model ${model}`);
};

export const getCountryLabel = (country: TradingCountryCode) => {
    const countryOption = regional.countriesOptionsMap.get(country);
    if (!countryOption) {
        throw new Error(`Country ${country} not found in the countries map`);
    }

    return countryOption.label.substring(countryOption.label.indexOf(' ') + 1);
};

export const calculatePercentageOfBalance = (params: PercentageOfBalanceParams) => {
    if (params.balance === null) {
        throw new Error('Account balance is null');
    }
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
    let originalBalanceText = await locator.textContent();
    if (!originalBalanceText) {
        throw new Error('Balance text content is empty');
    }

    const hasEllipsis = originalBalanceText?.includes('…');
    if (hasEllipsis) {
        originalBalanceText = originalBalanceText.slice(0, -1);
    }

    const originalBalance = BigNumber(originalBalanceText);

    return { originalBalance, hasEllipsis };
};

/**
 * Mocks remote message-system with an empty JWS config signed by develop key.
 */
export const mockRemoteMessageSystem = async (page: Page): Promise<void> =>
    await page.route('**/config.v1.jws', async route => {
        await route.fulfill({ status: 200, body: validJws });
    });

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
