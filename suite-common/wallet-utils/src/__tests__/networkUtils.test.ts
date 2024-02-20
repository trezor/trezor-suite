import { httpRequest } from '../networkUtils';

const setMock = (mock: any) => {
    global.fetch = jest.fn().mockImplementation(() => {
        const p = new Promise(resolve => {
            resolve({
                ok: mock.ok,
                json: () =>
                    new Promise((resolve, reject) => {
                        if (mock.reject) {
                            return reject(mock.reject);
                        }

                        return resolve(mock.response);
                    }),
                text: () =>
                    new Promise((resolve, reject) => {
                        if (mock.reject) {
                            return reject(mock.reject);
                        }
                        if (typeof mock.response === 'string') {
                            return resolve(mock.response);
                        }

                        return resolve(JSON.stringify(mock.response));
                    }),
            });
        });

        return p;
    });
};

describe('networkUtils', () => {
    describe('httpRequest', () => {
        beforeEach(() => {
            jest.resetAllMocks();
        });

        it('should resolve response with json', async () => {
            const mock = { ok: true, response: { a: 1 } };
            setMock(mock);
            const result = await httpRequest('foo', 'json');
            expect(result).toEqual(mock.response);
        });
        it('should resolve response with text', async () => {
            const mock = { ok: true, response: 'foo' };
            setMock(mock);
            const result = await httpRequest('foo');
            expect(result).toEqual(mock.response);
        });
    });
});
