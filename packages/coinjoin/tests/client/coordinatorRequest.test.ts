import { coordinatorRequest } from '../../src/client/coordinatorRequest';
import { patchResponse } from '../../src/utils/http';
import { createServer } from '../mocks/server';

let server: Awaited<ReturnType<typeof createServer>>;
let baseUrl = 'http://localhost:8081/';

describe('http', () => {
    beforeAll(async () => {
        server = await createServer();
        baseUrl = server.requestOptions.coordinatorUrl;
    });

    beforeEach(() => {
        server?.removeAllListeners('test-handle-request');
        server?.removeAllListeners('test-request');
    });

    afterAll(() => {
        if (server) server.close();
    });

    it('with 500 error', async () => {
        server?.addListener('test-request', ({ reject }) => {
            reject(500, { ErrorCode: 'InternalErrorCodeExample' });
        });

        await expect(coordinatorRequest('status', {}, { baseUrl })).rejects.toThrow(
            'InternalErrorCodeExample',
        );
    });

    it('with 500 error without errorCode', async () => {
        server?.addListener('test-request', ({ reject }) => {
            reject(500, { error: 'InternalErrorCodeExample' });
        });

        await expect(coordinatorRequest('status', {}, { baseUrl })).rejects.toThrow(
            JSON.stringify({ error: 'InternalErrorCodeExample' }),
        );
    });

    it('with 500 error without json header', async () => {
        server?.addListener('test-request', ({ response, resolve }) => {
            response.statusCode = 500;
            response.write('InternalErrorCodeExample');
            response.end();
            resolve();
        });

        await expect(coordinatorRequest('status', {}, { baseUrl })).rejects.toThrow(
            'Internal Server Error (500) InternalErrorCodeExample',
        );
    });

    it('with 500 error with invalid json', async () => {
        server?.addListener('test-request', ({ response, resolve }) => {
            response.statusCode = 500;
            response.setHeader('Content-Type', 'application/json');
            response.write('InternalErrorCodeExample');
            response.end();
            resolve();
        });

        await expect(coordinatorRequest('status', {}, { baseUrl })).rejects.toThrow(
            'Internal Server Error (500) InternalErrorCodeExample',
        );
    });

    it('with 404 error', async () => {
        server?.addListener('test-request', ({ reject }) => {
            reject(404);
        });

        await expect(coordinatorRequest('status', {}, { baseUrl })).rejects.toThrow('Not Found');
    });

    it('with 403 error (repeated request)', async () => {
        const identities: string[] = [];
        const requestListener = jest.fn(({ reject, request }) => {
            identities.push(request.headers['proxy-authorization']);
            reject(403);
        });
        server?.addListener('test-request', requestListener);

        jest.spyOn(console, 'error').mockImplementation(() => {}); // do not show error in console

        await expect(
            coordinatorRequest('status', {}, { baseUrl, attempts: 3, identity: 'abcd' }),
        ).rejects.toThrow('Forbidden');

        // 3 attempts with 3 identities
        expect(requestListener).toHaveBeenCalledTimes(3);
        expect(identities[0]).not.toEqual(identities[1]);
        expect(identities[1]).not.toEqual(identities[2]);
    });

    it('with ECONNRESET error', async () => {
        const spy = jest.fn();
        server?.addListener('test-request', ({ request, response, resolve }) => {
            spy();
            const identity = request.headers['proxy-authorization'];
            if (identity && identity.split(':').length > 1) {
                // handle request to change identity and resolve properly
                resolve();
            } else {
                // trigger ECONNRESET error
                response.destroy();
            }
        });

        const resp = await coordinatorRequest<any>(
            'status',
            {},
            { baseUrl, deadline: Date.now() + 3000, identity: 'abcd' },
        );

        expect(spy).toHaveBeenCalledTimes(2);
        expect(resp.RoundStates.length).toEqual(1);
    });

    it('with ECONNREFUSED error', async () => {
        await expect(
            coordinatorRequest(
                'status',
                {},
                { baseUrl: 'https://localhost/', deadline: Date.now() + 50000 },
            ),
        ).rejects.toThrow('ECONNREFUSED');
    });

    it('aborted request', async () => {
        const abort = new AbortController();
        abort.abort();

        await expect(
            coordinatorRequest('status', {}, { baseUrl, signal: abort.signal }),
        ).rejects.toThrow('Aborted by signal');
    });

    it('aborted delayed request', async () => {
        const abort = new AbortController();
        setTimeout(() => abort.abort(), 300);
        await expect(
            coordinatorRequest('status', {}, { baseUrl, delay: 1000, signal: abort.signal }),
        ).rejects.toThrow('Aborted by signal');
    });

    it('successful', done => {
        coordinatorRequest('input-registration', {}, { baseUrl }).then(resp => {
            expect(resp).toMatchObject({ AliceId: expect.any(String) });
        });
        // without baseUrl
        coordinatorRequest<any>(`status`, {}, { baseUrl }).then(resp => {
            expect(resp.RoundStates.length).toEqual(1);
        });
        // without json response
        coordinatorRequest('ready-to-sign', {}, { baseUrl }).then(resp => {
            expect(resp).toEqual('');
            done();
        });
    });

    it('with identity', async () => {
        const requestListener = jest.fn(req => {
            expect(req.headers).toMatchObject({
                'proxy-authorization': 'Basic abcd',
            });
        });
        server?.addListener('test-handle-request', requestListener);
        await coordinatorRequest('status', {}, { baseUrl, identity: 'abcd' });
    });

    it('patchResponse camelCaseToPascalCase', async () => {
        server?.addListener('test-request', ({ url, resolve, reject }) => {
            if (url.endsWith('/get-camel-case')) {
                return resolve({
                    foo: 'bar',
                    nestedObject: {
                        childArray1: [1, 2],
                        childArray2: [{ key1: true, key2: null, key3: 'string', key4: 1 }],
                        childObject1: null,
                        childObject2: {
                            field1: {
                                field2: {
                                    field3: {},
                                    field4: [],
                                },
                            },
                        },
                        affiliateData: {
                            abcd01234: { trezor: 'base64data', foo: 1 },
                        },
                    },
                });
            }
            if (url.endsWith('/get-exception')) {
                reject(500, {
                    type: 'Exception',
                    errorCode: 'InputBanned',
                    description: 'Some description',
                    exceptionData: { type: 'InputBannedExceptionData', bannedUntil: '00:00:00' },
                });
            }
        });

        const response = await coordinatorRequest('get-camel-case', {}, { baseUrl }).then(
            patchResponse,
        );
        expect(response).toEqual({
            Foo: 'bar',
            NestedObject: {
                ChildArray1: [1, 2],
                ChildArray2: [{ Key1: true, Key2: null, Key3: 'string', Key4: 1 }],
                ChildObject1: null,
                ChildObject2: {
                    Field1: {
                        Field2: {
                            Field3: {},
                            Field4: [],
                        },
                    },
                },
                AffiliateData: {
                    abcd01234: { trezor: 'base64data', foo: 1 },
                },
            },
        });

        try {
            await coordinatorRequest('get-exception', {}, { baseUrl });
        } catch (error) {
            expect(error.type).toBe('Exception');
            expect(error.errorCode).toBe(10); // string transformed to enum
            expect(error.exceptionData.Type).toBe('InputBannedExceptionData');
            expect(error.exceptionData.BannedUntil).toBe('00:00:00');
        }
    });
});
