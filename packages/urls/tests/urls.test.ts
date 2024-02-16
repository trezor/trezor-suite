import * as URLS from '../src/urls';

// Excluded urls
const excluded = [
    // DATA_URL because it returns 403 on itself (forbidden listing)
    URLS.DATA_URL,
    // TODO: it works locally but CI times out, probably cant handle the redirect or something..
    URLS.DATA_TOS_URL,
    // 503 from CI
    URLS.LTC_ADDRESS_INFO_URL,
    // T2B1 urls, they don't exist yet
    URLS.HELP_CENTER_DRY_RUN_T2B1_URL,
    URLS.HELP_CENTER_FW_DOWNGRADE_T2B1_URL,
    URLS.HELP_CENTER_PACKAGING_T2B1_URL,
];

describe('Test that all external links are alive', () => {
    beforeEach(() => {
        jest.setTimeout(30000);
    });

    Object.values(URLS)
        .filter((url: string) => !excluded.includes(url))
        .forEach((url: string) => {
            it(`HTTP GET request to ${url} should respond with range >= 200 && < 400`, async () => {
                const response = await fetch(url);
                expect(response.status).toBeGreaterThanOrEqual(200);
                expect(response.status).toBeLessThan(400);
            });
        });
});
