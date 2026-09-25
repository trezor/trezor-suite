import { ERRORS } from '@trezor/connect-common/src/constants';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { TypedCall } from '../DeviceCommands';
import { computeChunks, headerHash, parseAppImage, parseRootPacketTimestamp } from './appImage';
import type { ModularAppDefinition } from './types';

interface LoadModularAppParams {
    typedCall: TypedCall;
    appDef: ModularAppDefinition;
    // Force the device to re-download the app even if it is already cached.
    forceReload?: boolean;
}

// Loads a firmware modular app onto the device. Mirrors trezorlib `extapp.load`: the device drives
// the flow, first answering ExtAppLoad with either ExtAppLoaded (cache hit) or a header request,
// then requesting the root packet and payload chunks until it returns the instance id.
export const loadModularApp = async ({
    typedCall,
    appDef,
    forceReload = false,
}: LoadModularAppParams): Promise<number> => {
    const image = parseAppImage(appDef.binary);
    const versionParts = appDef.minVersion?.length ? appDef.minVersion : image.version;
    const version = {
        major: versionParts[0] ?? 0,
        minor: versionParts[1] ?? 0,
        patch: versionParts[2] ?? 0,
        build: versionParts[3] ?? 0,
    };
    // Fingerprint of the app to load; empty unless forcing a reload past the device cache.
    const fingerprint = forceReload ? headerHash(image.headerBytes).toString('hex') : '';

    const loadResp = await typedCall('ExtAppLoad', ['ExtAppLoaded', 'ExtAppHeaderRequest'], {
        id: image.id,
        version,
        fingerprint,
    });

    // Cache hit: the app is already loaded.
    if (loadResp.type === 'ExtAppLoaded') {
        return loadResp.message.instance_id;
    }

    // Header request: upload the app image. The device then asks for the root packet (optional) and
    // payload chunks until it returns the instance id. `resp` stays a single union across the loop so
    // the reassignments type-check, matching the firmware upload flow.
    let resp: PROTO.MessageResponse<
        'ExtAppRootPacketRequest' | 'ExtAppDataChunkRequest' | 'ExtAppLoaded'
    > = await typedCall(
        'ExtAppHeaderAck',
        ['ExtAppRootPacketRequest', 'ExtAppDataChunkRequest', 'ExtAppLoaded'],
        {
            header: image.headerBytes.toString('hex'),
            proof: appDef.proof.toString('hex'),
            root_packet_timestamp: parseRootPacketTimestamp(appDef.rootPacket),
        },
    );

    if (resp.type === 'ExtAppRootPacketRequest') {
        resp = await typedCall('ExtAppRootPacketAck', ['ExtAppDataChunkRequest', 'ExtAppLoaded'], {
            root_packet: appDef.rootPacket.toString('hex'),
        });
    }

    const chunks = computeChunks(image.payload, image.chunkSize, image.chunkHash);
    while (resp.type === 'ExtAppDataChunkRequest') {
        const chunk: { data: Buffer; hash: Buffer } | undefined = chunks[resp.message.index];
        if (!chunk) {
            throw ERRORS.TypedError(
                'Runtime',
                `loadModularApp: requested chunk ${resp.message.index} out of range`,
            );
        }
        resp = await typedCall('ExtAppDataChunkAck', ['ExtAppDataChunkRequest', 'ExtAppLoaded'], {
            data: chunk.data.toString('hex'),
            hash: chunk.hash.toString('hex'),
        });
    }

    return resp.message.instance_id;
};
