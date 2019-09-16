import fetch from 'node-fetch';

import { URLS as SUITE_URLS } from '@suite-constants';
import { URLS as ONBOARDING_URLS } from '@onboarding-constants';

// Excluded urls
const excluded = [
    // TREZOR_DATA_URL because it returns 403 on itself (forbidden listing)
    SUITE_URLS.TREZOR_DATA_URL,
    // TODO: it works locally but CI times out, probably cant handle the redirect or something..
    ONBOARDING_URLS.TOS_URL,
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
    getUrls(Object.values(SUITE_URLS)).forEach((url: string) => {
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
    getUrls(Object.values(ONBOARDING_URLS)).forEach((url: string) => {
        it(`HTTP GET request to ${url} should respond with range >= 200 && < 400`, async () => {
            const response = await fetch(url);
            expect(response.status).toBeGreaterThanOrEqual(200);
            expect(response.status).toBeLessThan(400);
        });
    });
});
