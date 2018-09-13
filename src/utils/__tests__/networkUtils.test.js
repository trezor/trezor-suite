import * as networkUtils from '../networkUtils';

describe('network utils', () => {
    beforeEach(() => {
        fetch.resetMocks();
    });

    it('httpRequest json ok response json', async () => {
        fetch.mockResponse(JSON.stringify({ test_json: '12345' }));
        const result = await networkUtils.httpRequest('/http-request-test-response-json/', 'json');
        expect(result).toMatchSnapshot();
    });

    it('httpRequest json ok response text', async () => {
        fetch.mockResponse(JSON.stringify({ test_json: '12345' }));
        const result = networkUtils.httpRequest('/http-request-test-response-text/', 'text');
        expect(result).toMatchSnapshot();
    });

    it('httpRequest json ok response binary', async () => {
        fetch.mockResponse(1);
        const result = networkUtils.httpRequest('/http-request-test-response-binary/', 'binary');
        expect(result).toMatchSnapshot();
    });

    it('httpRequest error (500)', async () => {
        fetch.mockResponse(JSON.stringify({ test_json: '12345' }), { status: 500 });
        try {
            await networkUtils.httpRequest('/test/', 'json');
        } catch (err) {
            expect(err).toMatchSnapshot();
        }
    });

    it('JSONRequest', async () => {
        fetch.mockResponse(JSON.stringify({ test_json: '01234' }));
        const result = await networkUtils.JSONRequest('/test/');
        expect(result).toMatchSnapshot();
    });

    it('JSONRequest error', async () => {
        fetch.mockResponse(JSON.stringify({ test_json: '12345' }), { status: 500 });
        try {
            await networkUtils.JSONRequest('/test/', 'json');
        } catch (err) {
            expect(err).toMatchSnapshot();
        }
    });
});
