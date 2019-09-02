import fetch from 'node-fetch';

import * as suiteUrls from '@suite/constants/suite/urls';
import * as onboardingUrls from '@suite/constants/onboarding/urls';

// Excluded urls
const excluded = [
    // TREZOR_DATA_URL because it returns 403 on itself (forbidden listing)
    suiteUrls.TREZOR_DATA_URL,
    // TODO: it works locally but CI times out, probably cant handle the redirect or something..
    onboardingUrls.TOS_URL,
];

const getUrls = (urls: string[]) => {
    return urls.filter((url: string) => {
        return !excluded.includes(url);
    });
};

describe('Test that all SUITE external links are alive', () => {
    beforeEach(() => {
        jest.setTimeout(20000);
    });
    getUrls(Object.values(suiteUrls)).forEach((url: string) => {
        it(`HTTP GET request to ${url} should respond with range >= 200 && < 400`, async () => {
            const response = await fetch(url);
            expect(response.status).toBeGreaterThanOrEqual(200);
            expect(response.status).toBeLessThan(400);
        });
    });
});

describe('Test that all ONBOARDING external links are alive', () => {
    beforeEach(() => {
        jest.setTimeout(20000);
    });
    getUrls(Object.values(onboardingUrls)).forEach((url: string) => {
        it(`HTTP GET request to ${url} should respond with range >= 200 && < 400`, async () => {
            const response = await fetch(url);
            expect(response.status).toBeGreaterThanOrEqual(200);
            expect(response.status).toBeLessThan(400);
        });
    });
});
