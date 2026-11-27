/**
 * wardd itself: one `WardHost` per wallet, the backends they persist to, and the WM they share.
 */
import { promises as fs } from 'fs';
import path from 'path';

import { DevWm, type DevWmSnapshot, type WmClient, toBytes, toHex } from '@trezor/ward-core';

import { InMemoryWardBackend, type WardBackend, loggingBackend } from './backend';
import { EvoluWardBackend } from './evoluBackend';
import { WardHost } from './host';

export interface WarddOptions {
    /** where SQLite files and the dev WM's state live; null keeps everything in memory */
    dataDir: string | null;
    /** an Evolu relay to replicate through */
    relayUrl?: string;
    /** the Quota Manager funding WARD owners on that relay (Suite Sync) */
    quotaManagerUrl?: string;
    /** in-memory backends instead of Evolu (tests, and `--memory`) */
    memory?: boolean;
    /** the WM; the persisted in-process dev WM if omitted */
    wm?: WmClient;
    /**
     * Run WITHOUT a WM, for firmware built `--ward-without-wm` (the MVP): a sync is a catch-up the
     * device persists, and a write is stored without a WM's say. Excludes `wm`.
     */
    withoutWm?: boolean;
    /** say what each replica stores (`--verbose`) */
    log?: (line: string) => void;
    /** roll a WM whose register went back forward, through the device; on unless false */
    rollForward?: boolean;
}

const DEV_WM_FILE = 'dev-wm.json';

export class Wardd {
    private readonly hosts = new Map<string, Promise<WardHost>>();
    private readonly backends: WardBackend[] = [];

    private constructor(
        private readonly opts: WarddOptions,
        readonly wm: WmClient | null,
        private readonly persistWm: () => Promise<void>,
    ) {}

    static async create(opts: WarddOptions): Promise<Wardd> {
        if (opts.withoutWm) {
            if (opts.wm) throw new Error('a wardd without a WM cannot also be given one');

            return new Wardd(opts, null, () => Promise.resolve());
        }
        if (opts.wm) return new Wardd(opts, opts.wm, () => Promise.resolve());
        const dev = new DevWm();
        if (opts.dataDir === null) return new Wardd(opts, dev, () => Promise.resolve());
        await fs.mkdir(opts.dataDir, { recursive: true });
        const file = path.join(opts.dataDir, DEV_WM_FILE);
        try {
            dev.restore(JSON.parse(await fs.readFile(file, 'utf8')) as DevWmSnapshot);
        } catch (e) {
            if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
        }
        // write-then-rename, so a crash mid-write cannot leave a WM that forgot its ledger
        const persist = async () => {
            await fs.writeFile(`${file}.tmp`, JSON.stringify(dev.snapshot()));
            await fs.rename(`${file}.tmp`, file);
        };

        return new Wardd(opts, dev, persist);
    }

    /** Open (or return the already-open) host for a wallet. */
    openStore(params: { wardId: string; wardOwnerSecret?: string }): Promise<WardHost> {
        const key = toHex(toBytes(params.wardId));
        let host = this.hosts.get(key);
        if (!host) {
            host = this.openBackend(params).then(opened => {
                const { log } = this.opts;
                const backend = log ? loggingBackend(opened, log) : opened;
                this.backends.push(backend);

                return new WardHost(toBytes(key), backend, this.wm, this.persistWm, log, {
                    rollForward: this.opts.rollForward,
                });
            });
            this.hosts.set(key, host);
            host.catch(() => this.hosts.delete(key));
        }

        return host;
    }

    private openBackend(params: {
        wardId: string;
        wardOwnerSecret?: string;
    }): Promise<WardBackend> {
        if (this.opts.memory) return Promise.resolve(new InMemoryWardBackend());
        if (!params.wardOwnerSecret) {
            return Promise.reject(new Error('openStore needs the WARD owner secret'));
        }

        return EvoluWardBackend.open({
            wardId: toBytes(params.wardId),
            wardOwnerSecret: params.wardOwnerSecret,
            dataDir: this.opts.dataDir,
            relayUrl: this.opts.relayUrl,
            quotaManagerUrl: this.opts.quotaManagerUrl,
        });
    }

    async close(): Promise<void> {
        await Promise.all(this.backends.map(b => b.close()));
        this.hosts.clear();
    }
}
