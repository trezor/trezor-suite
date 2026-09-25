import { sha256 } from '@noble/hashes/sha2.js';

import { ERRORS } from '@trezor/connect-common/src/constants';

// Parsed `.tapp` app image. Mirrors trezorlib AppImage (header + payload); Connect only needs the
// fields required to drive the load flow.
export interface ParsedAppImage {
    // App id from the header, used in ExtAppLoad.
    id: string;
    // App version [major, minor, patch, build].
    version: number[];
    // Privilege ring of the app.
    appRing: number;
    // Raw header bytes (used for ExtAppHeaderAck and the optional force-reload hash).
    headerBytes: Buffer;
    // Binary payload following the header.
    payload: Buffer;
    // Size of each payload chunk.
    chunkSize: number;
    // Hash of the first payload chunk; verifies the reconstructed hash chain.
    chunkHash: Buffer;
}

// Little-endian byte offsets inside the fixed part of the app header (magic "TRZA").
const HEADER = {
    MAGIC: 'TRZA',
    HEADER_SIZE: 4,
    ID: 8,
    ID_LEN: 32,
    VERSION: 108,
    APP_RING: 118,
    CHUNK_HASH: 128,
    CHUNK_HASH_LEN: 32,
    CHUNK_SIZE: 160,
} as const;

const ROOT_PACKET = {
    MAGIC: 'TRRP',
    TIMESTAMP: 8,
} as const;

export const parseAppImage = (binary: Buffer): ParsedAppImage => {
    if (binary.length < HEADER.CHUNK_SIZE + 2) {
        throw ERRORS.TypedError('Runtime', 'parseAppImage: binary too short');
    }
    if (binary.subarray(0, 4).toString('ascii') !== HEADER.MAGIC) {
        throw ERRORS.TypedError('Runtime', 'parseAppImage: invalid app image magic');
    }

    const headerSize = binary.readUInt32LE(HEADER.HEADER_SIZE);
    if (headerSize > binary.length) {
        throw ERRORS.TypedError('Runtime', 'parseAppImage: header size exceeds binary');
    }

    const id =
        binary
            .subarray(HEADER.ID, HEADER.ID + HEADER.ID_LEN)
            .toString('utf-8')
            .split('\0')[0] ?? '';

    const version = Array.from(binary.subarray(HEADER.VERSION, HEADER.VERSION + 4));

    return {
        id,
        version,
        appRing: binary.readUInt8(HEADER.APP_RING),
        headerBytes: binary.subarray(0, headerSize),
        payload: binary.subarray(headerSize),
        chunkSize: binary.readUInt16LE(HEADER.CHUNK_SIZE),
        chunkHash: binary.subarray(HEADER.CHUNK_HASH, HEADER.CHUNK_HASH + HEADER.CHUNK_HASH_LEN),
    };
};

// Splits the payload into chunks and builds the reverse SHA256 hash chain the device verifies.
// Each entry pairs a chunk with the hash of the following chunk; the seed for the last chunk is 32
// zero bytes. The final accumulated hash must equal the header chunk hash.
export const computeChunks = (
    payload: Buffer,
    chunkSize: number,
    chunkHash: Buffer,
): { data: Buffer; hash: Buffer }[] => {
    if (chunkSize <= 0) {
        throw ERRORS.TypedError('Runtime', 'computeChunks: invalid chunk size');
    }

    const chunks: Buffer[] = [];
    for (let i = 0; i < payload.length; i += chunkSize) {
        chunks.push(payload.subarray(i, i + chunkSize));
    }

    const result: { data: Buffer; hash: Buffer }[] = new Array(chunks.length);
    let hash = Buffer.alloc(32);
    for (let i = chunks.length - 1; i >= 0; i--) {
        const chunk = chunks[i] as Buffer;
        result[i] = { data: chunk, hash: Buffer.from(hash) };
        hash = Buffer.from(sha256(Buffer.concat([hash, chunk])));
    }

    if (!hash.equals(chunkHash)) {
        throw ERRORS.TypedError('Runtime', 'computeChunks: payload hash does not match header');
    }

    return result;
};

export const headerHash = (headerBytes: Buffer): Buffer => Buffer.from(sha256(headerBytes));

// Reads the authenticated-part timestamp (uint32 LE) from a root packet (`.tmr`, magic "TRRP").
export const parseRootPacketTimestamp = (rootPacket: Buffer): number => {
    if (rootPacket.subarray(0, 4).toString('ascii') !== ROOT_PACKET.MAGIC) {
        throw ERRORS.TypedError('Runtime', 'parseRootPacketTimestamp: invalid root packet magic');
    }

    return rootPacket.readUInt32LE(ROOT_PACKET.TIMESTAMP);
};
