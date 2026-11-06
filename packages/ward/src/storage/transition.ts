import type { WardLeafPart, WardTransition } from '../types';

const part = (value: WardLeafPart) => [value.encoding, value.nonceHex, value.tagHex, value.bodyHex];

/** Canonical equality for immutable transitions; leaf publication order is irrelevant. */
export const transitionFingerprint = (value: WardTransition): string =>
    JSON.stringify([
        value.counter,
        value.prevRoot,
        value.targetRoot,
        value.targetRootMac ?? null,
        value.authCommit ?? null,
        value.headMac ?? null,
        value.sigCommit ?? null,
        value.kind ?? 'commit',
        value.headNonce ?? null,
        value.leaves
            .toSorted((left, right) => left.entryKey.localeCompare(right.entryKey))
            .map(leaf => [leaf.entryKey, leaf.keyType, part(leaf.identity), part(leaf.content)]),
    ]);
