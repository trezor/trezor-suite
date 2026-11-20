/**
 * ===========================================================================================
 *   ADVERSARIAL TESTS -- A HOSTILE HOST, ON PURPOSE. NOT FOR NORMAL USE.
 * ===========================================================================================
 *
 * Each method here makes wardd do what a compromised host would: serve the device an OLDER
 * state than it stored. The device must refuse every one of them; a method here succeeding
 * against a real device is a firmware bug.
 *
 * Reachable only on a wardd started with `--adversarial-tests` (server.ts refuses the calls
 * otherwise), and only by name: every method and relay call is prefixed `adversarial`. Nothing
 * in the normal paths imports this file.
 */
import {
    EMPTY_ROOT,
    type RelayMessage,
    type WardEntryRequestJson,
    type WardTrie,
    equalBytes,
    serveEntry,
    toHex,
} from '@trezor/ward-core';

import { type Device, RelayFailure, type WardHost } from './host';
import { type Head, materialize } from './replica';

/** The relay calls below, all refused unless wardd runs with `--adversarial-tests`. */
export const ADVERSARIAL_METHODS = [
    'adversarialCatchUpToOlderHead',
    'adversarialServeEntry',
] as const;

export type AdversarialMethod = (typeof ADVERSARIAL_METHODS)[number];

export const isAdversarialMethod = (method: string): method is AdversarialMethod =>
    (ADVERSARIAL_METHODS as readonly string[]).includes(method);

/** Bytes to the wire, leaving the field out when it is absent -- as host.ts does. */
const opt = (key: string, v: Uint8Array | null | undefined) =>
    v?.length && !equalBytes(v, EMPTY_ROOT) ? { [key]: toHex(v) } : {};

/** The head the replica's line passed through at `counter`: the older state to serve. */
const olderHead = async (
    host: WardHost,
    counter: number,
): Promise<{ trie: WardTrie; head: Head }> => {
    const { trie, head } = await host.replica();
    if (!Number.isInteger(counter) || counter < 0 || counter >= head.counter) {
        throw new RelayFailure(
            'bad_request',
            `#${counter} is not older than the head #${head.counter}`,
        );
    }
    if (counter === 0) return { trie, head: { counter: 0, root: null } };
    const line = trie.linksEndingAt(head.counter, head.root, Number.MAX_SAFE_INTEGER);
    const at = line.find(l => l.toCounter === counter);
    if (!at) throw new RelayFailure('bad_request', `the replica's line has no head at #${counter}`);

    return { trie, head: { counter: at.toCounter, root: at.toRoot } };
};

/** ADVERSARIAL TEST: offer the device the older head at `counter` to catch up to. */
export const adversarialCatchUpToOlderHead = (
    host: WardHost,
    device: Device,
    counter: number,
    log?: (line: string) => void,
) =>
    host.exclusive(async () => {
        const { trie, head } = await olderHead(host, counter);
        log?.(`ADVERSARIAL TEST: offering the device the older head #${head.counter}`);
        const reply: RelayMessage = await host.answerChain(
            device,
            trie,
            await device({
                name: 'WardCatchUp',
                message: { to_counter: head.counter, ...opt('to_root', head.root) },
            }),
        );
        if (reply.name !== 'WardCatchUpAck') {
            const why = String((reply.message as { message?: string }).message ?? reply.name);
            log?.(`ADVERSARIAL TEST: the device refused: ${why}`);
            throw new RelayFailure('device_failure', why);
        }
        log?.('ADVERSARIAL TEST: the device ACCEPTED an older head -- a firmware bug');

        return { counter: head.counter, accepted: true };
    });

/** ADVERSARIAL TEST: answer a pull from the tree at the older head `counter`. */
export const adversarialServeEntry = (
    host: WardHost,
    request: WardEntryRequestJson,
    counter: number,
    log?: (line: string) => void,
) =>
    host.exclusive(async () => {
        const { head } = await olderHead(host, counter);
        const old = materialize(await host.storedLinks(), head);
        log?.(`ADVERSARIAL TEST: answering a pull from the tree at #${head.counter}`);

        return serveEntry(old.trie, request);
    });
