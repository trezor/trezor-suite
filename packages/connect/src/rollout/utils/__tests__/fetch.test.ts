import { fetchFirmware } from '../fetch';

jest.mock('../fetch');

describe('fetch utils', () => {
    it('it should fetch firmware', async () => {
        await expect(fetchFirmware('mockFirmware')).resolves.not.toThrow();
    });
});
