import type { ModularAppArtifacts, ModularAppArtifactsJson } from './types';
import { httpRequest } from '../../utils/assets';

const REMOTE_BASE_URL = 'https://data.trezor.io/firmware/modular-apps';

const decodeArtifacts = (json: ModularAppArtifactsJson): ModularAppArtifacts => ({
    binary: Buffer.from(json.binary, 'base64'),
    proof: Buffer.from(json.proof, 'base64'),
    rootPacket: Buffer.from(json.rootPacket, 'base64'),
});

// Remote artifacts can update without a new connect release. The bundled copy is the fallback.
export const createArtifactLoader = (
    fileName: string,
    bundled: ModularAppArtifactsJson,
): (() => Promise<ModularAppArtifacts>) => {
    let cached: Promise<ModularAppArtifacts> | undefined;

    return () => {
        if (!cached) {
            cached = (async () => {
                try {
                    const remote = await httpRequest(`${REMOTE_BASE_URL}/${fileName}`, 'json', {
                        skipLocalForceDownload: true,
                    });

                    return decodeArtifacts(remote as ModularAppArtifactsJson);
                } catch {
                    return decodeArtifacts(bundled);
                }
            })();
        }

        return cached;
    };
};
