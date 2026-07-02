import { type Fetcher, MoneroDaemonRpc } from '../daemonRpc';

type Captured = { url: string; body: any };

const mockFetcher =
    (response: unknown, captured: Captured[]): Fetcher =>
    (url, init) => {
        captured.push({ url, body: JSON.parse(init.body) });

        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(response) });
    };

const bytesToHex = (bytes: Uint8Array) => Buffer.from(bytes).toString('hex');

describe('MoneroDaemonRpc', () => {
    it('getOuts: sends (amount,index) pairs and parses key/mask into 32-byte arrays', async () => {
        const captured: Captured[] = [];
        const response = {
            status: 'OK',
            outs: [
                {
                    height: 1220516,
                    key: '5259e6fd6d66f29866d9139fd8d834a5ca6508b230214de313d9884c0c46e2b9',
                    mask: 'c398732f22155bc7c2716cb4f151a4dadd09b39dd6c3523ba343d18fdd9d928b',
                    txid: '',
                    unlocked: true,
                },
            ],
        };
        const rpc = new MoneroDaemonRpc('http://127.0.0.1:18081', mockFetcher(response, captured));

        const outs = await rpc.getOuts([{ amount: 0, index: 0n }]);

        expect(captured[0]?.url).toBe('http://127.0.0.1:18081/get_outs');
        expect(captured[0]?.body).toEqual({ outputs: [{ amount: 0, index: 0 }], get_txid: false });
        expect(outs).toHaveLength(1);
        expect(outs[0]?.key).toHaveLength(32);
        expect(outs[0]?.mask).toHaveLength(32);
        expect(bytesToHex(outs[0]!.key)).toBe(
            '5259e6fd6d66f29866d9139fd8d834a5ca6508b230214de313d9884c0c46e2b9',
        );
        expect(outs[0]?.unlocked).toBe(true);
    });

    it('sendRawTransaction: maps OK and failure responses', async () => {
        const okCaptured: Captured[] = [];
        const okRpc = new MoneroDaemonRpc(
            'http://x',
            mockFetcher({ status: 'OK', not_relayed: true }, okCaptured),
        );
        const ok = await okRpc.sendRawTransaction('deadbeef', true);
        expect(okCaptured[0]?.body).toEqual({ tx_as_hex: 'deadbeef', do_not_relay: true });
        expect(ok.ok).toBe(true);
        expect(ok.notRelayed).toBe(true);

        const failRpc = new MoneroDaemonRpc(
            'http://x',
            mockFetcher({ status: 'Failed', reason: 'double spend', double_spend: true }, []),
        );
        const fail = await failRpc.sendRawTransaction('deadbeef');
        expect(fail.ok).toBe(false);
        expect(fail.doubleSpend).toBe(true);
        expect(fail.reason).toBe('double spend');
    });

    it('getTransactions: returns [] without a request for an empty hash list', async () => {
        const captured: Captured[] = [];
        const rpc = new MoneroDaemonRpc('http://x', mockFetcher({}, captured));

        expect(await rpc.getTransactions([])).toEqual([]);
        expect(captured).toHaveLength(0);
    });

    it('getTransactions: parses tagged_key/bare-key outputs and the extra blob', async () => {
        const captured: Captured[] = [];
        const asJson = JSON.stringify({
            vout: [
                { amount: 0, target: { tagged_key: { key: 'aa'.repeat(32), view_tag: '5b' } } },
                { amount: 0, target: { key: 'bb'.repeat(32) } },
            ],
            extra: [1, 2, 3, 255],
        });
        const rpc = new MoneroDaemonRpc(
            'http://x',
            mockFetcher({ status: 'OK', txs: [{ tx_hash: 'feed', as_json: asJson }] }, captured),
        );

        const [tx] = await rpc.getTransactions(['feed']);

        expect(captured[0]?.url).toBe('http://x/get_transactions');
        expect(captured[0]?.body).toEqual({ txs_hashes: ['feed'], decode_as_json: true });
        expect(tx?.hash).toBe('feed');
        expect(tx?.voutStealthKeys).toEqual(['aa'.repeat(32), 'bb'.repeat(32)]);
        expect(bytesToHex(tx!.extra)).toBe('010203ff');
    });

    it('getOutputDistribution: unwraps json_rpc result.distributions[0]', async () => {
        const response = {
            result: {
                distributions: [
                    { amount: 0, base: 0, start_height: 1220516, distribution: [1, 3, 6, 10] },
                ],
                status: 'OK',
            },
        };
        const rpc = new MoneroDaemonRpc('http://x', mockFetcher(response, []));

        const dist = await rpc.getOutputDistribution(0, 0);

        expect(dist.startHeight).toBe(1220516);
        expect(dist.distribution).toEqual([1, 3, 6, 10]);
    });

    it('getFeeEstimate: parses base fee, per-priority fees and quantization mask', async () => {
        const captured: Captured[] = [];
        const rpc = new MoneroDaemonRpc(
            'http://x',
            mockFetcher(
                { result: { fee: 20000, fees: [20000, 80000, 320000], quantization_mask: 10000 } },
                captured,
            ),
        );

        const estimate = await rpc.getFeeEstimate();

        expect(captured[0]?.body.method).toBe('get_fee_estimate');
        expect(estimate).toEqual({
            baseFeePerByte: 20000,
            fees: [20000, 80000, 320000],
            quantizationMask: 10000,
        });
    });

    it('getInfo: parses height/target/synchronized', async () => {
        const captured: Captured[] = [];
        const rpc = new MoneroDaemonRpc(
            'http://x',
            mockFetcher(
                { result: { height: 100, target_height: 200, synchronized: false } },
                captured,
            ),
        );

        const info = await rpc.getInfo();

        expect(captured[0]?.body.method).toBe('get_info');
        expect(info).toEqual({ height: 100, targetHeight: 200, synchronized: false });
    });

    it('throws on json_rpc error', async () => {
        const rpc = new MoneroDaemonRpc(
            'http://x',
            mockFetcher({ error: { message: 'boom' } }, []),
        );
        await expect(rpc.getInfo()).rejects.toThrow('boom');
    });
});
