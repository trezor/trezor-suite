/**
 * Whether the WARD owner's records reach other hosts, and if not, why.
 *
 * A write is published once the WM accepts it, whatever the relay does: the record is in the local
 * store, and the relay only carries it on to other hosts. So a relay that refuses the owner never
 * fails a write. It leaves other hosts behind the WM until the records arrive, and that is what
 * this reports, with the reason and the number of records waiting.
 *
 * WHAT IS OBSERVED. The relay connection opening and closing, the relay's messages, and its quota
 * refusals (Evolu's `ProtocolQuotaError`). Evolu acknowledges no single record, so "replicating"
 * means: connected, and the relay answered the last full synchronization without refusing it. A
 * full synchronization sends every local record the relay lacks, so once one succeeds nothing is
 * waiting.
 *
 * WHY A RESYNC. After refusing an owner, the relay does not ask for the refused records again, and
 * Evolu does not resend them on its own: later writes travel, the refused ones stay local. Once the
 * owner has more storage, `resync` starts a full synchronization that carries them.
 *
 * WHY NOT CONNECT AN UNFUNDED OWNER. The relay turns such an owner away at connection, and Evolu
 * retries with a growing delay, up to half a minute. Like Suite, which connects its owner only once
 * the Quota Manager has funded it, wardd starts synchronizing once the Quota Manager reports
 * storage for the owner -- or at once, when no Quota Manager is configured or it cannot be asked.
 */
import { wardStorageNeed } from '@trezor/ward-core';

export type ReplicationReason =
    /** no relay is configured: the store is local only */
    | 'no_relay'
    /** the Quota Manager holds no storage for the owner, so the relay does not admit it */
    | 'no_registration'
    /** the relay refused a write: the owner's storage is used up */
    | 'quota_full'
    /** the relay cannot be reached, or does not admit the owner for a reason the QM does not show */
    | 'relay_unreachable';

export interface ReplicationStatus {
    state: 'local' | 'replicating' | 'not_replicating';
    reason?: ReplicationReason;
    /** the Evolu owner the records are stored under; public, the relay keys storage by it */
    ownerId: string;
    /** what the relay stores for the owner, estimated from the local records */
    storedBytes: number;
    /** the owner's limit at the Quota Manager; null if it holds none, absent if not asked */
    limitBytes?: number | null;
    /** local records other hosts may not have yet */
    waiting: number;
    /** what the holder of the device's delegated key should allocate now; 0 when enough */
    needBytes: number;
}

/** How long after the relay's answer a refusal may still arrive (it crosses Evolu's workers). */
export const REPLICATION_GRACE_MS = 1_000;

/** How long a Quota Manager answer is reused. */
const QUOTA_CACHE_MS = 5_000;

export interface RelayLinkOptions {
    ownerId: string;
    /** false: no relay is configured */
    hasRelay: boolean;
    /** the owner's limit at the Quota Manager (null: none); absent when no QM is configured */
    askLimit?: () => Promise<number | null>;
    /** begin synchronizing the owner with the relay (once) */
    start: () => void;
    /** start a full synchronization with the relay */
    resync: () => void;
    /** the bytes the relay stores for the owner, estimated */
    storedBytes: () => number;
    now?: () => number;
    graceMs?: number;
    /** how long `status` waits for the relay's answer after it started or resynchronized */
    settleMs?: number;
}

const DEFAULT_SETTLE_MS = 3_000;

/**
 * How often to look again while the owner waits for storage (unfunded, or refused): storage may be
 * given by another host of the wallet, or by Suite, without anyone asking this wardd.
 */
const RECHECK_MS = 60_000;

export class RelayLink {
    private connected = false;
    private refused = false;
    /** the limit the owner had when the relay last refused it */
    private limitAtRefusal: number | null | undefined;
    /** records written but not yet known to have reached the relay */
    private readonly waitingKeys = new Set<string>();
    /** records written while all looked well, kept until a refusal could no longer concern them */
    private recent: { key: string; at: number }[] = [];
    /** a full synchronization is under way; it confirms on the relay's answer */
    private confirming = false;
    private confirmTimer: ReturnType<typeof setTimeout> | undefined;
    private quota: { at: number; limit: number | null } | undefined;
    private started = false;
    private disposed = false;
    private recheck: ReturnType<typeof setInterval> | undefined;

    constructor(private readonly opts: RelayLinkOptions) {}

    private now() {
        return (this.opts.now ?? Date.now)();
    }

    private get grace() {
        return this.opts.graceMs ?? REPLICATION_GRACE_MS;
    }

    private get healthy() {
        return this.connected && !this.refused;
    }

    /** A local record was stored. */
    stored(key: string): void {
        if (!this.opts.hasRelay) return;
        if (this.healthy && !this.confirming) {
            const now = this.now();
            this.recent = this.recent.filter(r => now - r.at <= this.grace);
            this.recent.push({ key, at: now });
        } else {
            this.waitingKeys.add(key);
        }
    }

    /** The relay connection opened: Evolu starts a full synchronization by itself. */
    opened(): void {
        this.connected = true;
        this.startConfirming();
    }

    /** The relay connection closed, or failed to open. */
    disconnected(): void {
        this.connected = false;
        this.confirming = false;
        clearTimeout(this.confirmTimer);
        // whatever was in flight may not have arrived
        for (const r of this.recent) this.waitingKeys.add(r.key);
        this.recent = [];
    }

    /** The relay sent a message for the owner: an answer to what was sent before it. */
    answered(): void {
        if (!this.confirming || this.refused) return;
        clearTimeout(this.confirmTimer);
        this.confirmTimer = setTimeout(() => {
            if (this.disposed || !this.confirming || this.refused || !this.connected) return;
            this.confirming = false;
            this.waitingKeys.clear();
        }, this.grace);
    }

    /** The relay refused a write for lack of storage. */
    refusedForQuota(): void {
        // Evolu reports one refusal more than once (typed, and again as a logged error)
        if (this.refused) return;
        this.refused = true;
        this.confirming = false;
        clearTimeout(this.confirmTimer);
        // the limit the relay refused under; a larger one later is worth a resync
        this.limitAtRefusal = this.quota?.limit;
        void this.limit(true).then(limit => {
            if (this.refused && limit !== undefined) this.limitAtRefusal = limit;
        });
        const now = this.now();
        for (const r of this.recent) if (now - r.at <= this.grace) this.waitingKeys.add(r.key);
        this.recent = [];
    }

    /**
     * Begin: synchronize at once without a Quota Manager, otherwise once it reports storage for the
     * owner (or cannot be asked).
     */
    begin(): void {
        if (!this.opts.hasRelay) return;
        if (!this.opts.askLimit) {
            this.start();

            return;
        }
        void this.status();
        this.recheck = setInterval(() => {
            if (!this.started || this.refused) void this.status();
        }, RECHECK_MS);
        this.recheck.unref?.();
    }

    private start() {
        if (this.started || this.disposed) return;
        this.started = true;
        this.opts.start();
    }

    /** Start a full synchronization: after an allocation, or when asked. */
    resync(): void {
        if (!this.opts.hasRelay || this.disposed) return;
        if (!this.started) {
            this.start();

            return;
        }
        this.refused = false;
        this.startConfirming();
        this.opts.resync();
    }

    /** Wait, briefly, for the synchronization just started to be answered or refused. */
    private async settle() {
        const end = this.now() + (this.opts.settleMs ?? DEFAULT_SETTLE_MS);
        while (!this.disposed && this.now() < end) {
            if (this.refused || (this.connected && !this.confirming)) return;
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }

    private startConfirming() {
        this.confirming = true;
        clearTimeout(this.confirmTimer);
    }

    private async limit(fresh: boolean): Promise<number | null | undefined> {
        if (!this.opts.askLimit) return undefined;
        if (!fresh && this.quota && this.now() - this.quota.at < QUOTA_CACHE_MS) {
            return this.quota.limit;
        }
        try {
            const limit = await this.opts.askLimit();
            this.quota = { at: this.now(), limit };

            return limit;
        } catch {
            // an unreachable QM leaves the reason to what the relay shows
            return this.quota?.limit;
        }
    }

    /**
     * The current status. Asks the Quota Manager (if one is configured); when the owner has gained
     * storage -- its first, or more since the relay refused it -- starts synchronizing, and waits a
     * moment for the relay's answer.
     */
    async status(): Promise<ReplicationStatus> {
        const storedBytes = this.opts.storedBytes();
        const base = { ownerId: this.opts.ownerId, storedBytes, waiting: this.waitingKeys.size };
        if (!this.opts.hasRelay)
            return { ...base, state: 'local', reason: 'no_relay', needBytes: 0 };

        const limit = await this.limit(this.refused || !this.connected);
        if (!this.started && limit !== null) {
            this.start();
            await this.settle();
        } else if (
            this.refused &&
            typeof limit === 'number' &&
            this.limitAtRefusal !== undefined &&
            limit > (this.limitAtRefusal ?? 0)
        ) {
            this.resync();
            await this.settle();
        }
        const needBytes =
            limit === undefined
                ? 0
                : wardStorageNeed({ storedBytes, limitBytes: limit, refused: this.refused });
        const withLimit = limit === undefined ? base : { ...base, limitBytes: limit };
        const notReplicating = (reason: ReplicationReason): ReplicationStatus => ({
            ...withLimit,
            waiting: this.waitingKeys.size,
            state: 'not_replicating',
            reason,
            needBytes,
        });
        if (limit === null) return notReplicating('no_registration');
        if (!this.connected) return notReplicating('relay_unreachable');
        if (this.refused) return notReplicating('quota_full');

        return { ...withLimit, waiting: this.waitingKeys.size, state: 'replicating', needBytes };
    }

    close(): void {
        this.disposed = true;
        clearTimeout(this.confirmTimer);
        clearInterval(this.recheck);
    }
}
