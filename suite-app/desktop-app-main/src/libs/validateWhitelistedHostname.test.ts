import {
    validateWhitelistedHostname,
    validateWhitelistedHostnames,
} from './validateWhitelistedHostname';

describe(validateWhitelistedHostname.name, () => {
    it.each([
        {
            hostname: 'trezor.io',
            result: 'trezor.io',
        },
        {
            hostname: 'API.TREZOR.IO',
            result: 'api.trezor.io',
        },
        {
            hostname: 'localhost',
            result: 'localhost',
        },
        {
            hostname: '127.0.0.1',
            result: '127.0.0.1',
        },
        {
            hostname: '[::1]',
            result: '[::1]',
        },
    ])('accepts $hostname', ({ hostname, result }) => {
        const warn = jest.fn();

        expect(
            validateWhitelistedHostname({
                hostname,
                warn,
            }),
        ).toBe(result);

        expect(warn).not.toHaveBeenCalled();
    });

    it.each([
        {
            hostname: '',
            expectedWarning: 'Ignoring empty hostname.',
        },
        {
            hostname: 'com',
            expectedWarning: 'Ignoring hostname "com" because it is single-label.',
        },
        {
            hostname: '.com',
            expectedWarning: 'Ignoring hostname ".com" because it starts or ends with a dot.',
        },
        {
            hostname: 'trezor.io.',
            expectedWarning: 'Ignoring hostname "trezor.io." because it starts or ends with a dot.',
        },
        {
            hostname: '*.trezor.io',
            expectedWarning:
                'Ignoring hostname "*.trezor.io" because it contains invalid characters.',
        },
        {
            hostname: '-trezor.io',
            expectedWarning:
                'Ignoring hostname "-trezor.io" because it contains invalid characters.',
        },
        {
            hostname: 'foo..trezor.io',
            expectedWarning:
                'Ignoring hostname "foo..trezor.io" because it contains invalid characters.',
        },
    ])('rejects $hostname', ({ hostname, expectedWarning }) => {
        const warn = jest.fn();

        expect(
            validateWhitelistedHostname({
                hostname,
                warn,
            }),
        ).toBeUndefined();
        expect(warn).toHaveBeenCalledWith(expectedWarning);
    });
});

describe(validateWhitelistedHostnames.name, () => {
    it('filters invalid hostnames and keeps valid ones normalized', () => {
        const warn = jest.fn();

        expect(
            validateWhitelistedHostnames({
                hostnames: ['TREZOR.IO', 'com', '127.0.0.1', '.org'],
                warn,
            }),
        ).toEqual(['trezor.io', '127.0.0.1']);

        expect(warn.mock.calls).toEqual([
            ['Ignoring hostname "com" because it is single-label.'],
            ['Ignoring hostname ".org" because it starts or ends with a dot.'],
        ]);
    });
});
