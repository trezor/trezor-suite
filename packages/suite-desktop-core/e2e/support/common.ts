import test, { TestInfo } from '@playwright/test';
import { isEqual, omit } from 'lodash';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import { splitStringEveryNCharacters } from '@trezor/utils';

import { PlaywrightProjects } from '../playwright.config';

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

            return test.step(name, async () => await target.call(this, ...args));
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
