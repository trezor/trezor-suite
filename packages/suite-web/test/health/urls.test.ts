import fetch from 'node-fetch';

import * as suiteUrls from '@suite/constants/urls';
import * as onboardingUrls from '@suite/constants/onboarding/urls';

describe('Test that all SUITE external links are alive', () => {
    beforeEach(() => {
        jest.setTimeout(20000);
    });
    Object.values(suiteUrls).forEach((url: string) => {
        it(`HTTP GET request to ${url} should respond with 200`, async () => {
            const response = await fetch(url);
            expect(response.status).toEqual(200);
        });
    });
});

describe('Test that all ONBOARDING external links are alive', () => {
    beforeEach(() => {
        jest.setTimeout(20000);
    });
    Object.values(onboardingUrls).forEach((url: string) => {
        it(`HTTP GET request to ${url} should respond with 200`, async () => {
            const response = await fetch(url);
            expect(response.status).toEqual(200);
        });
    });
});
