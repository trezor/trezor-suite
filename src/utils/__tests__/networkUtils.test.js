import * as networkUtils from '../networkUtils';

describe('network utils', () => {
    beforeEach(() => {
        fetch.resetMocks();
    });

    it('httpRequest json ok response', async () => {
        fetch.mockResponse(JSON.stringify({ test_json: '12345' }));
        const result = await networkUtils.httpRequest('/test/', 'json');
        expect(result).toMatchSnapshot();
    });

    it('JSONRequest ok', async () => {
        fetch.mockResponse(JSON.stringify({ test_json: '01234' }));
        const result = await networkUtils.JSONRequest('/test/');
        expect(result).toMatchSnapshot();
    });
});
