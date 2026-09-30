import { createArtifactLoader } from './modularAppArtifacts';
import type { ModularAppArtifactsJson } from './types';
import { httpRequest } from '../../utils/assets';

jest.mock('../../utils/assets', () => ({
    httpRequest: jest.fn(),
}));

const mockHttpRequest = httpRequest as jest.MockedFunction<typeof httpRequest>;

const bundled: ModularAppArtifactsJson = {
    binary: Buffer.from('bundled-binary').toString('base64'),
    proof: '',
    rootPacket: Buffer.from('bundled-root').toString('base64'),
};

const remote: ModularAppArtifactsJson = {
    binary: Buffer.from('remote-binary').toString('base64'),
    proof: Buffer.from('remote-proof').toString('base64'),
    rootPacket: Buffer.from('remote-root').toString('base64'),
};

describe('modularApp/createArtifactLoader', () => {
    beforeEach(() => mockHttpRequest.mockReset());

    it('fetches the remote bundle and decodes base64 to buffers', async () => {
        mockHttpRequest.mockResolvedValue(remote);

        const artifacts = await createArtifactLoader('tron.json', bundled)();

        expect(mockHttpRequest).toHaveBeenCalledWith(
            expect.stringContaining('/tron.json'),
            'json',
            expect.anything(),
        );
        expect(artifacts.binary.toString()).toBe('remote-binary');
        expect(artifacts.proof.toString()).toBe('remote-proof');
        expect(artifacts.rootPacket.toString()).toBe('remote-root');
    });

    it('falls back to the bundled copy when the remote fetch fails', async () => {
        mockHttpRequest.mockRejectedValue(new Error('offline'));

        const artifacts = await createArtifactLoader('tron.json', bundled)();

        expect(artifacts.binary.toString()).toBe('bundled-binary');
        expect(artifacts.proof.length).toBe(0);
        expect(artifacts.rootPacket.toString()).toBe('bundled-root');
    });

    it('caches the result and resolves the artifacts at most once', async () => {
        mockHttpRequest.mockResolvedValue(remote);
        const load = createArtifactLoader('tron.json', bundled);

        const first = await load();
        const second = await load();

        expect(mockHttpRequest).toHaveBeenCalledTimes(1);
        expect(second).toBe(first);
    });
});
