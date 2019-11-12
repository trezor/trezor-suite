import { fetchFirmware, fetchReleasesList } from '../fetch';

jest.mock('../fetch');

describe('fetch utils', () => {
    it('it should fetch list of possible firmwares', async () => {
        await expect(fetchReleasesList('mockReleases')).resolves.not.toThrow();
    });

    it('it should fetch firmware', async () => {
        await expect(fetchFirmware('mockFirmware')).resolves.not.toThrow();
    });
});
