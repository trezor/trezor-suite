import test, { TestInfo } from '@playwright/test';
import { isEqual, omit } from 'lodash';
import { readdirSync } from 'node:fs';
import path from 'node:path';

import { regional } from '@suite-common/trading';
import { getAccountDecimals, localizeNumber } from '@suite-common/wallet-utils';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import { splitStringEveryNCharacters } from '@trezor/utils';

import releases from '../../../../submodules/trezor-common/releases.json';
import { PlaywrightProjects } from '../playwright.config';
import { PaymentMethods, PercentageOfBalanceParams } from './types';

export const isDesktopProject = (testInfo: TestInfo) =>
    testInfo.project.name === PlaywrightProjects.Desktop;

export const isWebProject = (testInfo: TestInfo) =>
    testInfo.project.name === PlaywrightProjects.Web;

export const getUrl = (testInfo: TestInfo) => {
    const electronApiURL = 'file:///';
    const apiURL = isDesktopProject(testInfo) ? electronApiURL : testInfo.project.use.baseURL;
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

// Wraps any TrezorUserEnvLink call with test.step
const TrezorUserEnvLinkProxy = new Proxy(TrezorUserEnvLink, {
    get(target: any, propKey) {
        const origMethod = target[propKey];

        return function (...args: any[]) {
            const params = JSON.stringify(args).slice(1, -1);
            const methodName = String(propKey);

            return test.step(`TrezorLink.${methodName}(${params})`, () =>
                origMethod.apply(target, args));
        };
    },
});

export { TrezorUserEnvLinkProxy };

export const isEqualWithOmit = (param: { object1: any; object2: any; mask: string[] }) =>
    isEqual(omit(param.object1, param.mask), omit(param.object2, param.mask));

export const formatAddress = (address: string) => splitStringEveryNCharacters(address, 4).join(' ');

// This function is used to override automatic fixtures that we want to skip in specific tests.
/* eslint-disable no-empty-pattern, react-hooks/rules-of-hooks */
export async function skipFixture({}, use: (r: void) => Promise<void>) {
    await use();
}
/* eslint-enable no-empty-pattern, react-hooks/rules-of-hooks */

export const getVideoPath = (videoFolder: string) => {
    const videoFilenames = readdirSync(videoFolder).filter(file => file.endsWith('.webm'));
    if (videoFilenames.length !== 1) {
        console.error(
            `Warning: More than one test video file found in the output directory: ${videoFolder}\nAttaching only the first one: ${videoFilenames[0]}`,
        );
    }

    return path.join(videoFolder, videoFilenames[0]);
};

export const findLatestVersionForModel = (
    model: 'T2T1' | 'T2B1' | 'T2T1' | 'T3B1' | 'T3T1',
): string => {
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

export const getCountryLabel = (country: string) => {
    const labelWithFlag = regional.countriesMap.get(country);
    if (!labelWithFlag) {
        throw new Error(`Country ${country} not found in the countries map`);
    }

    return labelWithFlag.substring(labelWithFlag.indexOf(' ') + 1);
};

export const paymentMethodToCamelCase = (text: string) =>
    text
        .split(' ')
        .map((word, index) => (index === 0 ? word.toLowerCase() : word))
        .join('') as PaymentMethods;

export const calculatePercentageOfBalance = (params: PercentageOfBalanceParams) => {
    if (params.balance === null) {
        throw new Error('Account balance is null');
    }
    const fraction = (parseFloat(params.balance) * params.percentage) / 100;
    const maxDecimals = getAccountDecimals(params.symbol);

    return localizeNumber(fraction, 'en', 0, maxDecimals);
};

export const countDecimalPlaces = (value: string | number) => {
    if (typeof value === 'string' && isNaN(Number(value))) {
        throw new Error('Value is not a valid number string');
    }

    return value.toString().split('.')[1].length || 0;
};
