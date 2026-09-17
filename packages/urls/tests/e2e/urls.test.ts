import * as URLS from '../../src/urls';

/**
 * This test is considered an E2E test and not meant to be run in test:unit.
 * It's because it depends on external services, so it must not block PR code validation.
 * It is run separately, see: * .github/workflows/test-urls.yml
 */

/**
 * URLs skipped entirely because they behave ambiguously: different result on CI and locally (usually because of bot detection).
 * The test would have to accept any code, which would be a useless test.
 * Try to keep this list at minimum!
 */
const skippedUrls = [
    // works locally but CI times out, probably can't handle the redirect.
    URLS.DATA_TOS_URL,
    // blog redirects to medium.com, which returns 403 both from CI and locally running test.
    URLS.LTC_ADDRESS_INFO_URL,
    // returns 403 from CI, but works locally.
    URLS.TREZOR_X_URL,
];

/**
 * URLs that should work in a real browser, but are untestable both locally and in CI (usually because of bot detection).
 * Remove from the list when the URL becomes reachable and fails the test suite.
 */
const expectedFailingUrls = [
    // DATA_URL because it returns 404 on itself (forbidden listing)
    URLS.DATA_URL,
    // captcha, returning 403 in ci
    URLS.TREZOR_FORUM_URL,
    // returns 'unauthorized'
    URLS.IMAGE_PROXY_API_URL,
];

// Sometimes we run test too much, I guess....
const clientErrorCodeWhitelist = [429];

const permanentRedirectCodes = [301, 308];

const isAcceptableHttpCode = (code: number): boolean => {
    // server error, not our fault
    if (code >= 500) return true;

    // permanent redirect means URL should be updated!
    if (permanentRedirectCodes.includes(code)) return false;

    // success or temporary redirect
    if (code >= 200 && code < 400) return true;

    // 4xx client error means that the link is broken
    return clientErrorCodeWhitelist.includes(code);
};

describe('External URLs integration', () => {
    beforeEach(() => {
        jest.setTimeout(30000);
    });

    describe('Internal test utils', () => {
        it(isAcceptableHttpCode.name, () => {
            expect(isAcceptableHttpCode(200)).toBe(true);
            expect(isAcceptableHttpCode(204)).toBe(true);
            expect(isAcceptableHttpCode(300)).toBe(true);
            expect(isAcceptableHttpCode(301)).toBe(false);
            expect(isAcceptableHttpCode(302)).toBe(true);
            expect(isAcceptableHttpCode(308)).toBe(false);
            expect(isAcceptableHttpCode(400)).toBe(false);
            expect(isAcceptableHttpCode(429)).toBe(true);
            expect(isAcceptableHttpCode(500)).toBe(true);
        });
    });

    describe('URLs expected to be alive', () => {
        Object.values(URLS)
            .filter(url => !expectedFailingUrls.includes(url) && !skippedUrls.includes(url))
            .forEach(url => {
                it(`HTTP GET request to ${url} should respond with an acceptable http code`, async () => {
                    const { status } = await fetch(url);
                    const isAcceptable = isAcceptableHttpCode(status);
                    if (!isAcceptable) {
                        throw `Got unacceptable http code ${status}`;
                    }
                });
            });
    });

    describe('URLs expected to be failing', () => {
        Object.values(URLS)
            .filter(url => expectedFailingUrls.includes(url) && !skippedUrls.includes(url))
            .forEach(url => {
                it(`HTTP GET request to ${url} should respond with an unacceptable http code`, async () => {
                    const { status } = await fetch(url);
                    const isAcceptable = isAcceptableHttpCode(status);
                    if (isAcceptable) {
                        throw `Got acceptable http code ${status}. Remove ${url} from expectedFailingUrls.`;
                    }
                });
            });
    });
});
