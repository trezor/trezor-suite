import * as URLS from '../../src/urls';

/**
 * This test is considered an E2E test and not meant to be run in test:unit.
 * It's because it depends on external services, so it must not block PR code validation.
 * It is run separately, see: * .github/workflows/test-urls.yml
 */

// Excluded urls
const excluded = [
    // DATA_URL because it returns 403 on itself (forbidden listing)
    URLS.DATA_URL,
    // TODO: it works locally but CI times out, probably cant handle the redirect or something..
    URLS.DATA_TOS_URL,
    // 503 from CI
    URLS.LTC_ADDRESS_INFO_URL,
    // captcha, returning 403 in ci
    URLS.TREZOR_FORUM_URL,
    // TODO: BIP329 article not live yet
    URLS.HELP_CENTER_BIP329_URL,
    // TODO T3W1 - articles not live yet
    URLS.HELP_CENTER_FW_DOWNGRADE_T3W1_URL,
    URLS.IMAGE_PROXY_API_URL, // returns 'unauthorized'
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

describe('Test that all external links are alive', () => {
    beforeEach(() => {
        jest.setTimeout(30000);
    });

    it(`internal test util ${isAcceptableHttpCode.name}`, () => {
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

    Object.values(URLS)
        .filter(url => !excluded.includes(url))
        .forEach(url => {
            it(`HTTP GET request to ${url} should respond with an acceptable http code`, async () => {
                const { status } = await fetch(url);
                expect(isAcceptableHttpCode(status)).toBe(true);
            });
        });
});
