/**
 * The service daemon's `--state-file`: the wallet it serves, its replica's link log and its dev
 * WM, in ONE file, rewritten (write, then rename) after every change.
 *
 * THE THREE TOGETHER OR NOT AT ALL, as in the Python daemon this replaces: a log without the WM's
 * head describes a state nothing attests, and a WM head without the log attests one nothing can be
 * proved against. One file also means the e2e's cleanup of that one path removes all of it.
 */
import { promises as fs } from 'fs';

import { type DevWmSnapshot } from '@trezor/ward-core';

import { type StoredLink, type WardBackend, linkId } from '../backend';

interface State {
    wardId: string | null;
    links: StoredLink[];
    wm: DevWmSnapshot | null;
}

export class ServiceStateFile implements WardBackend {
    private constructor(
        private readonly path: string | null,
        private state: State,
    ) {}

    /** Resume from `path` if it exists; a missing file is the first run. null keeps it in memory. */
    static async open(path: string | null): Promise<ServiceStateFile> {
        let state: State = { wardId: null, links: [], wm: null };
        if (path) {
            try {
                state = JSON.parse(await fs.readFile(path, 'utf8')) as State;
            } catch (e) {
                if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
            }
        }

        return new ServiceStateFile(path, state);
    }

    get wardId() {
        return this.state.wardId;
    }

    get wm() {
        return this.state.wm;
    }

    async setWardId(wardId: string) {
        this.state.wardId = wardId;
        await this.save();
    }

    async setWm(snapshot: DevWmSnapshot) {
        this.state.wm = snapshot;
        await this.save();
    }

    load(): Promise<StoredLink[]> {
        return Promise.resolve(this.state.links.map(l => JSON.parse(JSON.stringify(l))));
    }

    async append(link: StoredLink): Promise<void> {
        const id = linkId(link);
        if (!this.state.links.some(l => linkId(l) === id)) {
            this.state.links.push(JSON.parse(JSON.stringify(link)));
        }
        await this.save();
    }

    close(): Promise<void> {
        return Promise.resolve();
    }

    private async save() {
        if (!this.path) return;
        await fs.writeFile(`${this.path}.tmp`, JSON.stringify(this.state));
        await fs.rename(`${this.path}.tmp`, this.path);
    }
}
