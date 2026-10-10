import { loadAccountSnapshot } from './accountSnapshot';
import { prepareSweep } from './prepareSweep';
import { signSweep } from './signSweep';
import { createSweepLedger } from './sweepLedger';
import { evaluateSweepStatus } from './sweepStatus';
import { mockHistoryTransaction } from '../../mocks/mockAccountInfo';
import { mockBackend, mockFundedAccount } from '../../mocks/mockBackend';
import { type MockDeviceParams, mockDevice } from '../../mocks/mockDevice';
import { mockPreviousTransaction } from '../../mocks/mockPreviousTransaction';
import { mockWallet } from '../../mocks/mockWallet';
import type { AccountType } from '../bitcoin/accountType';
import type { SweepPlan } from '../bitcoin/composeSweep';
import { validateDestination } from '../bitcoin/destinationAddress';
import { createDeviceSession } from '../device/deviceSession';
import type { FirmwareVersion } from '../firmware/firmwareSupport';

const DESTINATION = '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy';

type SetupParams = {
    accountType?: AccountType;
    amounts?: string[];
    firmwareVersion?: FirmwareVersion;
    deviceParams?: Partial<MockDeviceParams>;
};

const setup = ({
    accountType = 'p2pkh',
    amounts = ['100000', '250000'],
    firmwareVersion = [1, 6, 3],
    deviceParams = {},
}: SetupParams = {}) => {
    const wallet = mockWallet();
    const chain = mockBackend();
    const { account, utxos } = mockFundedAccount({ chain, wallet, accountType, amounts });
    const device = mockDevice({ wallets: { '': wallet }, ...deviceParams });
    const session = createDeviceSession({
        transportCall: device.transportCall,
        getDeviceLostReason: () => undefined,
        requestPin: () => Promise.resolve(undefined),
        requestPassphrase: () => Promise.resolve(undefined),
        onButtonRequest: () => undefined,
    });
    const ledger = createSweepLedger();
    const destination = validateDestination({
        input: DESTINATION,
        firmwareVersion,
        ownScripts: new Set(),
    });
    if (!destination.success) throw new Error('test destination must be valid');

    const prepare = () =>
        prepareSweep({
            backend: chain.backend,
            ledger,
            account,
            destination: destination.payload,
            firmwareVersion,
            getRandomInt: () => 9,
        });

    const preparePlan = async (): Promise<SweepPlan> => {
        const prepared = await prepare();
        if (!prepared.success || !prepared.payload.plan) throw new Error('expected a plan');

        return prepared.payload.plan;
    };

    const sign = (plan: SweepPlan) =>
        signSweep({ session, backend: chain.backend, ledger, account, plan });

    return { wallet, chain, account, utxos, device, session, ledger, prepare, preparePlan, sign };
};

describe('signSweep', () => {
    it('signs the composed sweep and returns the transaction for broadcast', async () => {
        const { device, ledger, preparePlan, sign, utxos } = setup();
        const plan = await preparePlan();

        const signed = await sign(plan);

        expect(signed).toMatchObject({
            success: true,
            payload: { plan, outpoints: expect.arrayContaining([`${utxos[0]?.txid}:0`]) },
        });
        expect(ledger.getSignedSweeps()).toHaveLength(1);
        expect(device.countCalls('SignTx')).toBe(1);
    });

    it('sends the device a single output to the destination and none to the old wallet', async () => {
        const { device, preparePlan, sign } = setup();
        const plan = await preparePlan();

        await sign(plan);

        expect(device.calls.find(({ name }) => name === 'SignTx')?.data).toEqual({
            version: 1,
            inputs_count: 2,
            outputs_count: 1,
            coin_name: 'Bitcoin',
        });
        expect(device.calls.filter(({ name }) => name === 'TxAckOutput')).toEqual([
            {
                name: 'TxAckOutput',
                data: {
                    tx: {
                        output: {
                            address: DESTINATION,
                            amount: plan.amount,
                            script_type: 'PAYTOADDRESS',
                        },
                    },
                },
            },
        ]);
    });

    it('streams the verified previous transactions to the device', async () => {
        const { device, preparePlan, sign, wallet } = setup();

        await sign(await preparePlan());

        expect(device.streamedPreviousOutputs).toEqual(
            expect.arrayContaining([
                {
                    amount: '100000',
                    script_pubkey: wallet.getScript({ accountType: 'p2pkh' }).toString('hex'),
                },
                {
                    amount: '250000',
                    script_pubkey: wallet
                        .getScript({ accountType: 'p2pkh', addressIndex: 1 })
                        .toString('hex'),
                },
            ]),
        );
    });

    it('asks the device for the account key right before it starts signing', async () => {
        const { device, preparePlan, sign } = setup();

        await sign(await preparePlan());

        expect(device.calls.slice(0, 3).map(({ name }) => name)).toEqual([
            'GetPublicKey',
            'GetPublicKey',
            'SignTx',
        ]);
    });

    it.each<AccountType>(['p2sh', 'p2wpkh'])('signs a sweep of a %s account', async accountType => {
        const { preparePlan, sign } = setup({ accountType });

        expect((await sign(await preparePlan())).success).toBe(true);
    });

    it('types a P2SH destination as PAYTOSCRIPTHASH for firmware 1.4.2', async () => {
        const { device, preparePlan, sign } = setup({ firmwareVersion: [1, 4, 2] });

        expect((await sign(await preparePlan())).success).toBe(true);
        expect(device.calls.find(({ name }) => name === 'TxAckOutput')?.data).toMatchObject({
            tx: { output: { script_type: 'PAYTOSCRIPTHASH' } },
        });
    });

    describe('with a lying backend', () => {
        it('does not sign when the backend inflates the amount of an output', async () => {
            const { chain, account, device, preparePlan, sign, utxos } = setup({
                accountType: 'p2wpkh',
            });
            // The real output is worth 100 000. Claiming more would make the device, which
            // does not verify SegWit amounts, display a fee far below the one actually paid.
            chain.utxos.set(account.descriptor, [{ ...utxos[0]!, amount: '90000000' }, utxos[1]!]);

            expect(await sign(await preparePlan())).toEqual({
                success: false,
                error: {
                    type: 'previous-transaction-invalid',
                    error: { type: 'amount-mismatch', inputIndex: expect.any(Number) },
                },
            });
            expect(device.calls).toEqual([]);
        });

        it('does not sign when the backend serves a forged previous transaction', async () => {
            const { chain, device, preparePlan, sign, utxos, wallet } = setup();
            const forged = mockPreviousTransaction({
                outputs: [{ script: wallet.getScript({ accountType: 'p2pkh' }), value: '100000' }],
                nonce: 77,
            });
            chain.transactionHexes.set(utxos[0]!.txid, forged.hex);

            expect(await sign(await preparePlan())).toEqual({
                success: false,
                error: {
                    type: 'previous-transaction-invalid',
                    error: { type: 'hash-mismatch', inputIndex: expect.any(Number) },
                },
            });
            expect(device.calls).toEqual([]);
        });

        it('does not sign a legacy output the backend presents as a SegWit one', async () => {
            const { chain, account, device, preparePlan, sign, wallet } = setup({
                accountType: 'p2wpkh',
            });
            const legacy = mockPreviousTransaction({
                outputs: [{ script: wallet.getScript({ accountType: 'p2pkh' }), value: '500000' }],
                nonce: 99,
            });
            chain.transactionHexes.set(legacy.txid, legacy.hex);
            chain.utxos.set(account.descriptor, [
                {
                    txid: legacy.txid,
                    vout: 0,
                    amount: '500000',
                    address: wallet.getAddress({ accountType: 'p2wpkh' }),
                    path: wallet.getAddressPath({ accountType: 'p2wpkh' }),
                    confirmations: 6,
                    blockHeight: 800000,
                },
            ]);

            expect(await sign(await preparePlan())).toEqual({
                success: false,
                error: {
                    type: 'previous-transaction-invalid',
                    error: { type: 'script-mismatch', inputIndex: 0 },
                },
            });
            expect(device.calls).toEqual([]);
        });

        it('does not sign when a previous transaction cannot be fetched', async () => {
            const { chain, device, preparePlan, sign, utxos } = setup();
            chain.transactionHexes.delete(utxos[1]!.txid);

            expect(await sign(await preparePlan())).toEqual({
                success: false,
                error: { type: 'backend', message: 'not found' },
            });
            expect(device.calls).toEqual([]);
        });

        it('does not sign when an input stops being unspent after composition', async () => {
            const { chain, account, device, preparePlan, sign, utxos } = setup();
            const plan = await preparePlan();
            chain.utxos.set(account.descriptor, [utxos[0]!]);

            expect(await sign(plan)).toEqual({ success: false, error: { type: 'inputs-changed' } });
            expect(device.calls).toEqual([]);
        });

        it('does not sign when an input turns out to be spent in the mempool', async () => {
            const { chain, account, device, preparePlan, sign, utxos } = setup();
            const plan = await preparePlan();
            const info = chain.accountInfos.get(account.descriptor)!;
            chain.accountInfos.set(account.descriptor, {
                ...info,
                history: {
                    total: 3,
                    unconfirmed: 1,
                    transactions: [
                        mockHistoryTransaction({
                            blockHeight: -1,
                            details: {
                                vin: [
                                    {
                                        txid: utxos[0]!.txid,
                                        n: 0,
                                        isAddress: true,
                                        isAccountOwned: true,
                                    },
                                ],
                                vout: [],
                                size: 0,
                                totalInput: '0',
                                totalOutput: '0',
                            },
                        }),
                    ],
                },
            });

            expect(await sign(plan)).toEqual({
                success: false,
                error: { type: 'ambiguous-state', reasons: ['utxo-spent-in-mempool'] },
            });
            expect(device.calls).toEqual([]);
        });
    });

    it('does not sign when the device now holds a different wallet', async () => {
        const { chain, account, ledger, preparePlan } = setup();
        const plan = await preparePlan();
        const otherDevice = mockDevice({ wallets: { '': mockWallet('cc'.repeat(16)) } });
        const otherSession = createDeviceSession({
            transportCall: otherDevice.transportCall,
            getDeviceLostReason: () => undefined,
            requestPin: () => Promise.resolve(undefined),
            requestPassphrase: () => Promise.resolve(undefined),
            onButtonRequest: () => undefined,
        });

        expect(
            await signSweep({
                session: otherSession,
                backend: chain.backend,
                ledger,
                account,
                plan,
            }),
        ).toEqual({ success: false, error: { type: 'account-key-mismatch' } });
        expect(otherDevice.countCalls('SignTx')).toBe(0);
    });

    it('never sends the same transaction to the device twice after a rejection', async () => {
        const { device, ledger, prepare, preparePlan, sign } = setup({
            deviceParams: { isOutputRejected: true },
        });
        const plan = await preparePlan();

        expect(await sign(plan)).toMatchObject({
            success: false,
            error: { type: 'failure', code: 'Failure_ActionCancelled' },
        });
        // The user may already have seen this amount on the device.
        expect(await sign(plan)).toEqual({
            success: false,
            error: { type: 'plan-already-attempted' },
        });
        expect(device.countCalls('SignTx')).toBe(1);
        expect(ledger.getSignedSweeps()).toEqual([]);

        const recomposed = await prepare();
        expect(recomposed.success && recomposed.payload.plan?.amount).not.toBe(plan.amount);
    });

    it('resets the device after a signing that did not finish', async () => {
        const { device, preparePlan, sign } = setup({ deviceParams: { isOutputRejected: true } });

        await sign(await preparePlan());

        expect(device.calls.at(-1)).toEqual({ name: 'Initialize', data: {} });
    });

    it('rejects a transaction from the device that differs from the composed one', async () => {
        const { ledger, preparePlan, sign } = setup({
            deviceParams: { isSignedAmountAltered: true },
        });

        expect(await sign(await preparePlan())).toMatchObject({
            success: false,
            error: { type: 'signed-transaction-invalid' },
        });
        expect(ledger.getSignedSweeps()).toEqual([]);
    });

    it.each<[string, (plan: SweepPlan) => SweepPlan]>([
        [
            'an amount that differs from the device output',
            plan => ({ ...plan, amount: (BigInt(plan.amount) - 1000n).toString() }),
        ],
        [
            'a device output paying another address',
            plan => ({
                ...plan,
                output: { ...plan.output, address: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2' },
            }),
        ],
        [
            'a device input claiming another amount than the verified one',
            plan => ({ ...plan, inputs: plan.inputs.with(0, { ...plan.inputs[0]!, amount: '1' }) }),
        ],
        ['an input that is not among the verified ones', plan => ({ ...plan, utxos: [] })],
    ])('refuses a plan with %s before anything else happens', async (_description, tamper) => {
        const { chain, device, preparePlan, sign } = setup();
        const plan = tamper(await preparePlan());
        chain.backend.getAccountUtxo.mockClear();

        expect(await sign(plan)).toEqual({ success: false, error: { type: 'plan-inconsistent' } });
        expect(chain.backend.getAccountUtxo).not.toHaveBeenCalled();
        expect(device.calls).toEqual([]);
    });

    describe('after signing', () => {
        it('does not sign again while the signed transaction is not on the network', async () => {
            const { chain, account, device, prepare, preparePlan, sign } = setup();
            const plan = await preparePlan();
            const signed = await sign(plan);
            if (!signed.success) throw new Error('signing must succeed');

            // The user has not broadcast it: the backend still lists the inputs as unspent and
            // shows no spending transaction.
            const snapshot = await loadAccountSnapshot({ backend: chain.backend, account });
            if (!snapshot.success) throw new Error('snapshot must load');
            expect(
                evaluateSweepStatus({ snapshot: snapshot.payload, record: signed.payload }),
            ).toBe('not-in-mempool');

            // Neither the old plan nor a fresh composition can reach the device again.
            expect(await sign(plan)).toEqual({
                success: false,
                error: { type: 'inputs-already-signed' },
            });
            const recomposed = await prepare();
            expect(recomposed.success && recomposed.payload.plan).toBeUndefined();
            expect(device.countCalls('SignTx')).toBe(1);
        });

        it('lets a new page session compose the still unspent inputs again', async () => {
            const first = setup();
            const signed = await first.sign(await first.preparePlan());
            expect(signed.success).toBe(true);

            // A reload loses the ledger and the signed bytes. The backend state is all there is.
            const reloadedLedger = createSweepLedger();
            const destination = validateDestination({
                input: DESTINATION,
                firmwareVersion: [1, 6, 3],
                ownScripts: new Set(),
            });
            if (!destination.success) throw new Error('test destination must be valid');

            const recomposed = await prepareSweep({
                backend: first.chain.backend,
                ledger: reloadedLedger,
                account: first.account,
                destination: destination.payload,
                firmwareVersion: [1, 6, 3],
                getRandomInt: () => 30,
            });

            expect(recomposed.success && recomposed.payload.plan?.inputs).toHaveLength(2);
        });
    });
});
