import { isUsingTrezorServer } from './isUsingTrezorServer';

describe(isUsingTrezorServer.name, () => {
    it.each([
        {
            description: 'dev relay server',
            relayUrl: 'https://suite-sync-dev.suite.sldev.cz/evolu/',
            expectedResult: true,
        },
        {
            description: 'prod relay server',
            relayUrl: 'https://suite-sync.trezor.io/evolu/',
            expectedResult: true,
        },
        {
            description: 'leading/trailing whitespace',
            relayUrl: '  https://suite-sync.trezor.io/evolu/  ',
            expectedResult: true,
        },
        {
            description: 'different casing',
            relayUrl: 'HTTPS://SUITE-SYNC.TREZOR.IO/EVOLU/',
            expectedResult: true,
        },
        {
            description: 'custom relay server',
            relayUrl: 'https://my-custom-relay.example.com',
            expectedResult: false,
        },
        {
            description: 'local relay server',
            relayUrl: 'http://127.0.0.1:4000/evolu/',
            expectedResult: false,
        },
        {
            description: 'empty string',
            relayUrl: '',
            expectedResult: false,
        },
        {
            description: 'partial match',
            relayUrl: 'https://suite-sync.trezor.io',
            expectedResult: false,
        },
    ])('returns $expectedResult for $description', ({ relayUrl, expectedResult }) => {
        expect(isUsingTrezorServer(relayUrl)).toBe(expectedResult);
    });
});
