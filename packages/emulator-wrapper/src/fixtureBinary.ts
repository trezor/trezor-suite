import type { RecordingFixture } from './recordedFrame';

const V1_HEADER_SIZE = 9;

const readVarint = (buf: Buffer, offset: number): [value: number, nextOffset: number] => {
    let result = 0;
    let shift = 0;
    let pos = offset;
    for (;;) {
        const byte = buf[pos];
        if (byte === undefined) {
            throw new Error('Truncated varint while reading FirmwareUpload payload length');
        }
        pos += 1;
        result += (byte & 0x7f) * 2 ** shift;
        if ((byte & 0x80) === 0) break;
        shift += 7;
    }

    return [result, pos];
};

/**
 * Reconstructs the firmware binary from a recording's FirmwareUpload frames.
 *
 * Each `FirmwareUpload` the host sent during recording carries a slice of the
 * binary as its protobuf `payload` field (field 1, wire type 2 =
 * length-delimited). Concatenating the decoded payloads in order yields the
 * exact binary that was flashed — callers should verify the result against
 * `fixture.meta.firmwareSha256` via `assertFixtureMatchesBinary`.
 *
 * This keeps the firmware-update e2e test self-contained: the fixture is the
 * single source of truth for both the device replies AND the binary fed to
 * Connect, so the test doesn't depend on @trezor/connect-data shipping any
 * particular firmware version (those get bumped and pruned over time).
 */
export const reconstructBinaryFromFixture = (fixture: RecordingFixture): Buffer => {
    const chunks: Buffer[] = [];
    for (const event of fixture.events) {
        if (event.kind !== 'frame' || event.dir !== 'out' || event.name !== 'FirmwareUpload') {
            continue;
        }
        // strip the 9-byte protocol-v1 frame header (magic + messageType + length)
        const body = Buffer.from(event.hex, 'hex').subarray(V1_HEADER_SIZE);
        // FirmwareUpload = { payload: bytes }; field 1, wire type 2 -> tag 0x0a
        if (body[0] !== 0x0a) {
            throw new Error(
                `Unexpected FirmwareUpload payload tag 0x${body[0]?.toString(16)} (expected 0x0a)`,
            );
        }
        const [len, dataStart] = readVarint(body, 1);
        chunks.push(body.subarray(dataStart, dataStart + len));
    }

    if (chunks.length === 0) {
        throw new Error('Fixture contains no FirmwareUpload frames; cannot reconstruct binary');
    }

    return Buffer.concat(chunks);
};
