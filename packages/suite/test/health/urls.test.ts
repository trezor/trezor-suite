import fetch from 'node-fetch';

import * as suiteUrls from '@suite/constants/urls';
import * as onboardingUrls from '@suite/constants/onboarding/urls';

describe('Test that all SUITE external links are alive', () => {
    beforeEach(() => {
        jest.setTimeout(20000);
    });
    Object.values(suiteUrls).forEach((url: string) => {
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
    Object.values(onboardingUrls).forEach((url: string) => {
        it(`HTTP GET request to ${url} should respond with range >= 200 && < 400`, async () => {
            const response = await fetch(url);
            expect(response.status).toBeGreaterThanOrEqual(200);
            expect(response.status).toBeLessThan(400);
        });
    });
});
