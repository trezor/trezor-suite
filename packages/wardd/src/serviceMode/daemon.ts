/**
 * `wardd --service`: wardd serving a SERVICE build itself, over the device's WARD interface.
 *
 * On a service build the device does not ask the calling app for WARD data -- it asks a daemon on a
 * dedicated interface, inverting the conversation: wardd binds the interface once
 * (`WardServiceOpen`) and from then on only answers what the device asks. This replaces the Python
 * stand-in `connect-cli/e2e/ward-service-daemon.py`, keeping its command line and its log lines,
 * which `ward-queue.sh` parses:
 *
 *   NOTE ...                        anything worth reading
 *   BOUND <time>                    the interface is bound
 *   SERVED <n> <Request> -> <Reply> <detail>     one exchange, numbered
 *   SERVED ? <Request> -> FAILED <error> <detail>
 *   STOPPED <n>                     how many were served
 *   BIND-FAILED <error>
 */
import { DevWm, toBytes, toHex } from '@trezor/ward-core';

import { WardHost } from '../host';
import { materialize } from '../replica';
import { SERVICE_PROTOCOL_VERSION, type ServiceMessage, UdpCodec, WARD_PORT_OFFSET } from './codec';
import { ServiceStateFile } from './stateFile';

export interface ServiceDaemonOptions {
    /** the device's WIRE port; the WARD interface is at + WARD_PORT_OFFSET */
    port: number;
    stateFile: string | null;
    log: (line: string) => void;
    /** resolves when the daemon should stop */
    stopped: Promise<void>;
}

const now = () => {
    const d = new Date();
    const two = (n: number) => String(n).padStart(2, '0');

    return `${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, '0')}`;
};

/** The first bytes of a hex blob, as the Python daemon logs them: `-` when absent. */
const hexlead = (v: unknown, length = 8) => {
    if (typeof v !== 'string' || !v) return '-';

    return v.slice(0, 2 * length) + (v.length > 2 * length ? '…' : '');
};
const num = (v: unknown) => (typeof v === 'number' ? String(v) : 'None');

const detailOf = ({ name, message: m }: ServiceMessage) => {
    if (name === 'WardServiceFetch') {
        return ` entry_key=${hexlead(m.entry_key)} at counter=${num(m.current_counter)} root=${hexlead(m.current_root)}`;
    }
    if (name === 'WardSyncRequest') {
        return ` ward_id=${hexlead(m.ward_id)} from counter=${num(m.current_counter)}`;
    }
    if (name === 'WardPublish')
        return ` entry_key=${hexlead(m.entry_key)} to counter=${num(m.counter)}`;

    return '';
};

export const runServiceDaemon = async (opts: ServiceDaemonOptions): Promise<number> => {
    const { log } = opts;
    const wardPort = opts.port + WARD_PORT_OFFSET;
    log(`NOTE ${now()} binding the WARD interface on udp ${wardPort} (wire ${opts.port})`);

    const state = await ServiceStateFile.open(opts.stateFile);
    const wm = new DevWm();
    if (state.wm) wm.restore(state.wm);
    const persistWm = () => state.setWm(wm.snapshot());
    let host: WardHost | null = null;
    const hostFor = async (wardIdHex: string) => {
        if (host && toHex(host.wardId) === wardIdHex) return host;
        if (host) throw new Error('this daemon serves one wallet; a sync for another was refused');
        if (state.wardId !== wardIdHex) await state.setWardId(wardIdHex);
        host = new WardHost(toBytes(wardIdHex), state, wm, persistWm);

        return host;
    };
    if (state.wardId) {
        const resumed = materialize(await state.load(), await wm.head(toBytes(state.wardId)));
        log(
            `NOTE resumed the replica at counter ${resumed.head.counter} ` +
                `(${resumed.trie.size} entr${resumed.trie.size === 1 ? 'y' : 'ies'})`,
        );
        await hostFor(state.wardId);
    }

    const io = await UdpCodec.open(wardPort);
    try {
        // WHICH TRANSPORT, probed: see UdpCodec.probe
        const codec = await io.probe();
        if (codec === null) {
            log(
                'BIND-FAILED could not tell which transport the WARD service interface speaks; ' +
                    'is the emulator a --enable-ward-service-channel build?',
            );

            return 1;
        }
        if (!codec) {
            log(
                'BIND-FAILED the service interface speaks THP (a ward_service_thp build); wardd ' +
                    'serves the codec interface only -- use ward-service-daemon.py for this build',
            );

            return 1;
        }
        log(`NOTE ${now()} the service interface speaks codec v1`);

        await io.write({
            name: 'WardServiceOpen',
            message: { protocol_version: SERVICE_PROTOCOL_VERSION },
        });
        const ack = await io.read(15_000);
        if (ack?.name !== 'WardServiceOpenAck') {
            log(
                `BIND-FAILED ${ack ? `${ack.name} ${JSON.stringify(ack.message)}` : 'no answer to WardServiceOpen'}`,
            );

            return 1;
        }
        log(`BOUND ${now()}`);
        if (host) {
            const { head, trie } = await (host as WardHost).replica();
            log(`NOTE serving a replica at counter ${head.counter} with ${trie.size} entries`);
        } else {
            log('NOTE serving a replica at counter 0 with 0 entries');
        }

        // THE LOOP OF ONE MESSAGE: the device writes a request and reads the reply; no pipelining.
        const served: string[] = [];
        let stopping = false;
        void opts.stopped.then(() => {
            stopping = true;
        });
        while (!stopping) {
            const request = await io.read(500);
            if (!request) continue;
            served.push(request.name);
            const detail = detailOf(request);
            let reply: ServiceMessage;
            try {
                if (request.name === 'WardSyncRequest') {
                    reply = await (
                        await hostFor(String(request.message.ward_id ?? ''))
                    ).serviceSync(request.message);
                } else if (!host) {
                    throw new Error(`${request.name} before any sync: no wallet established`);
                } else if (request.name === 'WardServiceFetch') {
                    reply = await (host as WardHost).serviceFetch(request.message);
                } else if (request.name === 'WardPublish') {
                    reply = await (host as WardHost).servicePublish(request.message);
                } else {
                    throw new Error(
                        `the daemon was asked something it cannot serve: ${request.name}`,
                    );
                }
            } catch (e) {
                // LOGGED, AND THE DEVICE GETS SILENCE: "the daemon could not answer" and "the
                // daemon was never asked" must not look the same from the shell
                log(
                    `SERVED ? ${request.name} -> FAILED ${e instanceof Error ? e.message : String(e)}${detail}`,
                );
                continue;
            }
            await io.write(reply);
            log(`SERVED ${served.length} ${request.name} -> ${reply.name}${detail}`);
        }
        log(`NOTE ${now()} exchanges in order: ${served.length ? served.join(', ') : '(none)'}`);
        log(`STOPPED ${served.length}`);

        return 0;
    } finally {
        io.close();
    }
};
