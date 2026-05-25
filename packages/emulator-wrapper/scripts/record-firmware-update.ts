/* eslint-disable no-console, import/no-extraneous-dependencies, import/order */
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseArgs } from 'node:util';

// @trezor/connect and @trezor/protobuf are intentionally not in this package's
// package.json deps — pulling them in would create a circular dependency
// (@trezor/connect already devDeps on @trezor/emulator-wrapper for the
// firmware-update e2e test). This script is dev tooling run via tsx, never
// imported from other packages; the modules resolve through the monorepo's
// hoisted node_modules at runtime.
import TrezorConnect, { DEVICE_EVENT, TRANSPORT_EVENT } from '@trezor/connect';
import { MessagesSchema, protobufManager } from '@trezor/protobuf';
import { isTransportInstance } from '@trezor/transport-common';

import { FrameReassembler } from '../src/frameReassembler';
import type {
    RecordedEvent,
    RecordedFrameEvent,
    RecordedMarkerEvent,
    RecordingFixture,
} from '../src/recordedFrame';
import { RecordingNodeUsbTransport } from './recordingNodeUsbTransport';

const DEFAULT_FIRMWARE_BY_MODEL: Record<string, string> = {
    T1B1: 'connect-data/files/firmware/t1b1/trezor-t1b1-1.13.1.bin',
    T2T1: 'connect-data/files/firmware/t2t1/trezor-t2t1-2.9.1.bin',
    T2B1: 'connect-data/files/firmware/t2b1/trezor-t2b1-2.9.1.bin',
    T3B1: 'connect-data/files/firmware/t3b1/trezor-t3b1-2.9.1.bin',
    T3T1: 'connect-data/files/firmware/t3t1/trezor-t3t1-2.9.1.bin',
    T3W1: 'connect-data/files/firmware/t3w1/trezor-t3w1-2.9.3.bin',
};

const REPO_PACKAGES_ROOT = path.resolve(__dirname, '../../');

const printUsage = () => {
    console.log(`Usage:
  yarn workspace @trezor/emulator-wrapper record:firmware-update \\
      --model <T2T1|T3T1|T2B1|T3B1|T3W1|T1B1> \\
      [--firmware <path-to-target-firmware.bin>] \\
      [--from-fw <current-version-on-device>] \\
      [--out <path-to-output-fixture.json>]

Defaults:
  --firmware  derived from --model (latest .bin bundled in packages/connect-data)
  --from-fw   "unknown" (only metadata; edit later if needed)
  --out       .context/firmware-update-<model>-<sha8>.json (in workspace root)

What this does:
  1. Initializes TrezorConnect with a recording USB transport.
  2. Calls firmwareUpdate() against the physically connected device.
  3. Logs every USB chunk in both directions, reassembles them into protobuf
     frames, and detects device-disconnect / -reconnect events.
  4. When the device emits a ButtonRequest, prints a hint so you know to press
     the physical button. Connect handles ButtonAck automatically.
  5. Writes the captured events as a JSON fixture you can hand back for
     wrapper interceptor work.

Make sure:
  - The device is connected via USB before starting the run.
  - No other process (Bridge, Suite, browser) is talking to the device.
`);
};

const { values } = parseArgs({
    options: {
        model: { type: 'string' },
        'from-fw': { type: 'string' },
        firmware: { type: 'string' },
        out: { type: 'string' },
        help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: false,
    strict: false,
});

if (values.help) {
    printUsage();
    process.exit(0);
}

const requireArg = (name: string, value: unknown): string => {
    if (typeof value !== 'string' || value.length === 0) {
        printUsage();
        console.error(`\nMissing required --${name}`);
        process.exit(2);
    }

    return value;
};

const optionalArg = (value: unknown): string | undefined =>
    typeof value === 'string' && value.length > 0 ? value : undefined;

const model = requireArg('model', values.model);
const defaultFirmwareRelative = DEFAULT_FIRMWARE_BY_MODEL[model];
const firmwarePath: string | undefined =
    optionalArg(values.firmware) ??
    (defaultFirmwareRelative
        ? path.resolve(REPO_PACKAGES_ROOT, defaultFirmwareRelative)
        : undefined);
if (!firmwarePath) {
    printUsage();
    console.error(
        `\nMissing --firmware and no default known for model "${model}". Known models: ${Object.keys(DEFAULT_FIRMWARE_BY_MODEL).join(', ')}`,
    );
    process.exit(2);
}
const fromVersion = optionalArg(values['from-fw']) ?? 'unknown';
const outPath: string =
    optionalArg(values.out) ??
    path.resolve(
        REPO_PACKAGES_ROOT,
        '../.context',
        `firmware-update-${model}-${path.basename(firmwarePath, '.bin')}.json`,
    );

const firmwareBuffer = fs.readFileSync(path.resolve(firmwarePath));
const firmwareSha256 = createHash('sha256').update(firmwareBuffer).digest('hex');

const events: RecordedEvent[] = [];
const lookupMessageName = (id: number) => {
    try {
        return protobufManager.findSchema(id).messageName;
    } catch {
        return undefined;
    }
};
const reassemblers = {
    out: new FrameReassembler('out', lookupMessageName),
    in: new FrameReassembler('in', lookupMessageName),
};

protobufManager.load(MessagesSchema as unknown as Parameters<typeof protobufManager.load>[0]);

let buttonRequestMessageType: number | undefined;
try {
    buttonRequestMessageType = protobufManager.findSchema('ButtonRequest').messageType;
    console.log(`ButtonRequest messageType = ${buttonRequestMessageType}`);
} catch (e) {
    console.warn(
        `Could not resolve ButtonRequest message type — recording will continue but won't print user-action hints (${(e as Error).message})`,
    );
}

const formatFrame = (frame: RecordedFrameEvent): string =>
    `[${frame.dir.padEnd(3)}] type=${frame.messageType} ${frame.name} (${frame.hex.length / 2} B)`;

const handleFrame = (frame: RecordedFrameEvent) => {
    events.push(frame);
    console.log(formatFrame(frame));
    if (
        frame.dir === 'in' &&
        buttonRequestMessageType !== undefined &&
        frame.messageType === buttonRequestMessageType
    ) {
        console.log(
            '\n  >>> Device is waiting for user input. Press the corresponding button on the physical device.\n',
        );
    }
};

const pushMarker = (marker: RecordedMarkerEvent) => {
    events.push(marker);
    console.log(`[mark] ${marker.type}`);
};

let knownDevicePath: string | undefined;
let deviceReady = false;

const observeChunks = (dir: 'out' | 'in', chunk: Buffer, ts: number) => {
    const frame = reassemblers[dir].addChunk(chunk, ts);
    if (frame) {
        handleFrame(frame);
    }
};

const writeFixture = () => {
    const fixture: RecordingFixture = {
        meta: {
            model,
            fromVersion,
            toVersion: 'unknown',
            firmwareSha256,
            firmwareSize: firmwareBuffer.length,
            recordedAt: new Date().toISOString(),
            protocol: 'v1',
        },
        events,
    };
    const resolvedOut = path.resolve(outPath);
    fs.mkdirSync(path.dirname(resolvedOut), { recursive: true });
    fs.writeFileSync(resolvedOut, JSON.stringify(fixture, null, 2));
    console.log(`\nFixture written to ${resolvedOut} (${events.length} events)`);
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

console.log('=== Recorder script started ===');

(async () => {
    console.log('[1] creating RecordingNodeUsbTransport...');
    const transport = new RecordingNodeUsbTransport({ id: 'recording-node-usb' }, observeChunks);
    console.log(
        `[2] transport created — name=${transport.name}, apiType=${transport.apiType}, isTransportInstance=${isTransportInstance(transport)}`,
    );

    console.log('[3] manual transport.init() preflight (bypasses TrezorConnect)...');
    const preflight = await transport.init();
    console.log(
        `[3a] preflight result: success=${preflight.success}${preflight.success ? '' : ' error=' + JSON.stringify(preflight.error)}`,
    );
    if (preflight.success) {
        transport.listen();
        const enumerateRes = await transport.enumerate();
        console.log(
            `[3b] enumerate result:`,
            enumerateRes.success
                ? `${enumerateRes.payload.length} device(s): ${JSON.stringify(enumerateRes.payload)}`
                : `error=${JSON.stringify(enumerateRes.error)}`,
        );
    }
    transport.stop();
    console.log('[3c] preflight transport stopped, handing to TrezorConnect');

    const transportForConnect = new RecordingNodeUsbTransport(
        { id: 'recording-node-usb' },
        observeChunks,
    );

    TrezorConnect.on(TRANSPORT_EVENT, event => {
        console.log(`[TRANSPORT_EVENT]`, event.type, JSON.stringify(event.payload, null, 2));
    });

    TrezorConnect.on(DEVICE_EVENT, event => {
        console.log(`[DEVICE_EVENT]`, event.type, event.payload?.path);
        if (event.type === 'device-connect' || event.type === 'device-changed') {
            if (!deviceReady) {
                deviceReady = true;
                knownDevicePath = event.payload.path;
            } else if (event.payload.path !== knownDevicePath) {
                pushMarker({ kind: 'marker', ts: Date.now(), type: 'device-reconnect' });
                knownDevicePath = event.payload.path;
            }
        }
        if (event.type === 'device-disconnect') {
            pushMarker({ kind: 'marker', ts: Date.now(), type: 'device-disconnect' });
        }
    });

    console.log('[4] calling TrezorConnect.init with transports: [transportForConnect]');
    await TrezorConnect.init({
        manifest: {
            appUrl: 'emulator-wrapper-recorder',
            appName: 'Emulator Wrapper Recorder',
            email: 'noreply@trezor.io',
        },
        transports: [transportForConnect],
        debug: true,
    });
    console.log('[5] TrezorConnect.init resolved, sleeping 2s for transport to settle');
    await sleep(2000);

    console.log(`\nFirmware: ${firmwarePath}`);
    console.log(`  size: ${firmwareBuffer.length} bytes`);
    console.log(`  sha256: ${firmwareSha256}`);
    console.log(`\n[6] calling TrezorConnect.firmwareUpdate()`);

    try {
        const binary = firmwareBuffer.buffer.slice(
            firmwareBuffer.byteOffset,
            firmwareBuffer.byteOffset + firmwareBuffer.byteLength,
        ) as ArrayBuffer;
        const result = await TrezorConnect.firmwareUpdate({ binary });
        console.log('\nfirmwareUpdate result:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('\nfirmwareUpdate threw:', err);
    } finally {
        writeFixture();
        await TrezorConnect.dispose();
    }
})().catch(err => {
    console.error(err);
    writeFixture();
    process.exit(1);
});
