// Minimal monerod JSON-RPC client for the transaction-building flow.
//
// Talks to the local (restricted) monerod managed by suite-desktop. Only the endpoints the send
// pipeline needs: get_outs (fetch decoy ring members), get_output_distribution (gamma decoy
// selection), send_raw_transaction (relay / consensus-validate), get_info (chain height),
// get_transactions (fetch tx data), is_key_image_spent (spent-check). Response shapes verified
// against a live v0.18 node. All of these are allowed under `--restricted-rpc`.

export interface DaemonOutput {
    /** One-time output public key (32 bytes). */
    key: Uint8Array;
    /** Pedersen commitment / mask (32 bytes). */
    mask: Uint8Array;
    height: number;
    unlocked: boolean;
}

export interface OutputDistribution {
    startHeight: number;
    base: number;
    /** Cumulative output counts per height from `startHeight`. */
    distribution: number[];
}

export interface SendRawTransactionResult {
    ok: boolean;
    status: string;
    reason: string;
    notRelayed: boolean;
    doubleSpend: boolean;
    invalidInput: boolean;
    invalidOutput: boolean;
    lowMixin: boolean;
    overspend: boolean;
    feeTooLow: boolean;
    tooBig: boolean;
    raw: Record<string, unknown>;
}

export interface DaemonInfo {
    height: number;
    targetHeight: number;
    synchronized: boolean;
}

export interface FeeEstimate {
    /** Default per-byte base fee. */
    baseFeePerByte: number;
    /** Per-priority per-byte base fees (low, medium, high, …); empty on older nodes. */
    fees: number[];
    /** Fee quantization mask — the fee is rounded up to a multiple of this. */
    quantizationMask: number;
}

export interface SourceTransaction {
    hash: string;
    /** One-time (stealth) public key of each output, in vout order, hex. */
    voutStealthKeys: string[];
    /** Raw tx_extra blob. */
    extra: Uint8Array;
}

/** Reads the per-output one-time key from a decoded vout, handling pre- and post-view-tag layouts. */
const readVoutKey = (vout: any): string => {
    const target = vout?.target ?? {};

    // HF15+ outputs use `tagged_key` (one-time key + view tag); older ones a bare `key`.
    return target.tagged_key?.key ?? target.key ?? '';
};

export type Fetcher = (
    url: string,
    init: { method: string; headers: Record<string, string>; body: string },
) => Promise<{ ok: boolean; status: number; json: () => Promise<any> }>;

const toBytes = (hex: string): Uint8Array => Uint8Array.from(Buffer.from(hex, 'hex'));

export class MoneroDaemonRpc {
    constructor(
        private readonly url: string,
        private readonly fetcher: Fetcher = globalThis.fetch as unknown as Fetcher,
    ) {}

    private async post(path: string, body: unknown): Promise<any> {
        const response = await this.fetcher(`${this.url}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            throw new Error(`monerod ${path} HTTP ${response.status}`);
        }

        return response.json();
    }

    private async jsonRpc(method: string, params: unknown): Promise<any> {
        const data = await this.post('/json_rpc', { jsonrpc: '2.0', id: '0', method, params });
        if (data.error) {
            throw new Error(`monerod ${method} error: ${data.error.message ?? 'unknown'}`);
        }

        return data.result;
    }

    async getInfo(): Promise<DaemonInfo> {
        const r = await this.jsonRpc('get_info', {});

        return {
            height: Number(r.height ?? 0),
            targetHeight: Number(r.target_height ?? 0),
            synchronized: Boolean(r.synchronized),
        };
    }

    /** Fetch output keys + commitments for (amount, global-index) pairs — the decoy ring members. */
    async getOuts(
        outputs: { amount: number | bigint; index: number | bigint }[],
        getTxid = false,
    ): Promise<DaemonOutput[]> {
        const data = await this.post('/get_outs', {
            outputs: outputs.map(o => ({ amount: Number(o.amount), index: Number(o.index) })),
            get_txid: getTxid,
        });
        if (data.status !== 'OK') {
            throw new Error(`monerod get_outs failed: ${data.status}`);
        }

        return (data.outs as any[]).map(out => ({
            key: toBytes(out.key),
            mask: toBytes(out.mask),
            height: Number(out.height ?? 0),
            unlocked: Boolean(out.unlocked),
        }));
    }

    /**
     * Fetch the transactions that created a set of owned outputs, decoded enough to spend them: the
     * per-output one-time keys (to locate the owned output) and the raw tx_extra (for the tx public
     * key). Allowed under `--restricted-rpc`.
     */
    async getTransactions(hashes: string[]): Promise<SourceTransaction[]> {
        if (hashes.length === 0) {
            return [];
        }

        const data = await this.post('/get_transactions', {
            txs_hashes: hashes,
            decode_as_json: true,
        });
        if (data.status !== 'OK') {
            throw new Error(`monerod get_transactions failed: ${data.status}`);
        }

        return ((data.txs as any[]) ?? []).map(entry => {
            const json = JSON.parse(entry.as_json ?? '{}');

            return {
                hash: String(entry.tx_hash ?? ''),
                voutStealthKeys: ((json.vout as any[]) ?? []).map(readVoutKey),
                extra: Uint8Array.from((json.extra as number[]) ?? []),
            };
        });
    }

    /**
     * Per-key-image spent status: 0 = unspent, 1 = spent in a block, 2 = spent in the tx pool. A
     * view-only wallet cannot compute key images, so it cannot tell which of its outputs were already
     * spent; the send flow exports the key images from the device and checks them here before
     * selecting inputs, to avoid building a double-spend. Allowed under `--restricted-rpc`.
     */
    async isKeyImageSpent(keyImages: string[]): Promise<number[]> {
        if (keyImages.length === 0) {
            return [];
        }
        const data = await this.post('/is_key_image_spent', { key_images: keyImages });
        if (data.status !== 'OK') {
            throw new Error(`monerod is_key_image_spent failed: ${data.status}`);
        }

        return ((data.spent_status as number[]) ?? []).map(Number);
    }

    /** Current per-byte base fee + quantization mask, used to size a consensus-valid fee. */
    async getFeeEstimate(): Promise<FeeEstimate> {
        const r = await this.jsonRpc('get_fee_estimate', {});

        return {
            baseFeePerByte: Number(r.fee ?? 0),
            fees: ((r.fees as number[]) ?? []).map(Number),
            quantizationMask: Number(r.quantization_mask ?? 1),
        };
    }

    async getOutputDistribution(
        amount: number,
        fromHeight: number,
        cumulative = true,
    ): Promise<OutputDistribution> {
        const r = await this.jsonRpc('get_output_distribution', {
            amounts: [amount],
            from_height: fromHeight,
            cumulative,
            binary: false,
        });
        const dist = r.distributions?.[0];
        if (!dist) {
            throw new Error('monerod get_output_distribution returned no distribution');
        }

        return {
            startHeight: Number(dist.start_height ?? 0),
            base: Number(dist.base ?? 0),
            distribution: (dist.distribution as number[]) ?? [],
        };
    }

    /**
     * Relay or (with `doNotRelay`) consensus-validate a serialized transaction. With
     * `doNotRelay: true` monerod fully verifies the tx without broadcasting it — the validation
     * loop used while developing the assembler.
     */
    async sendRawTransaction(txHex: string, doNotRelay = false): Promise<SendRawTransactionResult> {
        const data = await this.post('/send_raw_transaction', {
            tx_as_hex: txHex,
            do_not_relay: doNotRelay,
        });

        return {
            ok: data.status === 'OK',
            status: String(data.status ?? ''),
            reason: String(data.reason ?? ''),
            notRelayed: Boolean(data.not_relayed),
            doubleSpend: Boolean(data.double_spend),
            invalidInput: Boolean(data.invalid_input),
            invalidOutput: Boolean(data.invalid_output),
            lowMixin: Boolean(data.low_mixin),
            overspend: Boolean(data.overspend),
            feeTooLow: Boolean(data.fee_too_low),
            tooBig: Boolean(data.too_big),
            raw: data,
        };
    }
}
