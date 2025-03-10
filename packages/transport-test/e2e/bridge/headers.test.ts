import { controller as TrezorUserEnvLink } from './controller';

describe('headers test', () => {
    beforeAll(async () => {
        await TrezorUserEnvLink.connect();
        await TrezorUserEnvLink.startBridge();
    });

    afterAll(async () => {
        await TrezorUserEnvLink.stopBridge();
        TrezorUserEnvLink.disconnect();
    });

    const fixturesForbidden = [
        {
            endpoint: 'call',
            statusCode: 404,
        },
        {
            endpoint: 'send',
            statusCode: 404,
        },
        {
            endpoint: 'receive',
            statusCode: 404,
        },
        {
            endpoint: 'enumerate',
            statusCode: 403,
        },
        {
            endpoint: 'acquire',
            statusCode: 404,
        },
        {
            endpoint: 'release',
            statusCode: 404,
        },
        {
            endpoint: 'listen',
            statusCode: 403,
        },
    ];

    fixturesForbidden.forEach(f => {
        test(`origin: https://spoofedtrezor.io and endpoint ${f.endpoint} is forbidden`, async () => {
            // invalid
            const response = await fetch(`http://localhost:21325/${f.endpoint}`, {
                method: 'POST',
                headers: {
                    Origin: 'https://spoofedtrezor.io',
                },
            });

            expect(response.ok).toEqual(false);
            expect(response.status).toEqual(f.statusCode);
        });

        test(`origin: https://zor.io and endpoint ${f.endpoint} is forbidden`, async () => {
            // invalid
            const response = await fetch(`http://localhost:21325/${f.endpoint}`, {
                method: 'POST',
                headers: {
                    Origin: 'https://zor.io',
                },
            });

            expect(response.ok).toEqual(false);
            expect(response.status).toEqual(f.statusCode);
        });
    });

    const fixturesAllowed = [
        // todo: other endpoint need more unification steps between old and new
        {
            endpoint: 'enumerate',
            statusCode: 200,
        },
    ];

    fixturesAllowed.forEach(f => {
        test(`endpoint ${f.endpoint} with allowed origin`, async () => {
            const response = await fetch(`http://localhost:21325/${f.endpoint}`, {
                method: 'POST',
                headers: {
                    Origin: 'https://trezor.io',
                },
            });

            expect(response.status).toEqual(f.statusCode);
        });
    });
});
