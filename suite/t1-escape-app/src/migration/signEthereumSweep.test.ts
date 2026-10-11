import { getAddress, parseTransaction } from 'viem';

import type { AccountInfo } from '@trezor/blockchain-link-types';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { ok } from '@trezor/type-utils';

import { createEthereumSweepLedger } from './ethereumSweepLedger';
import { prepareEthereumSweep } from './prepareEthereumSweep';
import { signEthereumSweep } from './signEthereumSweep';
import { mockBackend, mockFundedEthereumAddress } from '../../mocks/mockBackend';
import { type MockDeviceParams, mockDevice } from '../../mocks/mockDevice';
import { type MockWallet, mockWallet } from '../../mocks/mockWallet';
import { type TransportCall, createDeviceSession } from '../device/deviceSession';
import type { EthereumSweepPlan } from '../ethereum/composeEthereumSweep';
import type { EthereumDestination } from '../ethereum/ethereumDestination';

const DESTINATION: EthereumDestination = {
    address: getAddress('0x70997970c51812dc3a010c7d01b50e0d17dc79c8'),
};

const ONE_ETHER = '1000000000000000000';

/**
 * Lets a test script the answer to `EthereumSignTx`. The answers are deliberately shaped like
 * the legacy decode, with `null` for absent fields, which the shared message type cannot express.
 */
const answerSignTxWith =
    (message: Record<string, unknown>) =>
    (call: TransportCall): TransportCall =>
    params =>
        params.name === 'EthereumSignTx'
            ? Promise.resolve(
                  ok({ type: 'EthereumTxRequest', message } as unknown as PROTO.MessageResponse),
              )
            : call(params);

type SetupParams = {
    deviceParams?: Partial<MockDeviceParams>;
    passphrase?: string;
    /** Further wallets the device holds behind other passphrases. */
    otherWallets?: Record<string, MockWallet>;
    /** Wraps the device so that a test can script one answer. */
    interceptCall?: (call: TransportCall) => TransportCall;
};

const setup = async ({
    deviceParams = {},
    passphrase,
    otherWallets = {},
    interceptCall,
}: SetupParams = {}) => {
    const wallet = mockWallet();
    const chain = mockBackend();
    const device = mockDevice({
        wallets: { [passphrase ?? '']: wallet, ...otherWallets },
        ...deviceParams,
    });
    let activePassphrase = passphrase;
    const session = createDeviceSession({
        transportCall: interceptCall ? interceptCall(device.transportCall) : device.transportCall,
        getDeviceLostReason: () => undefined,
        requestPin: () => Promise.resolve(undefined),
        requestPassphrase: () => Promise.resolve(activePassphrase),
        onButtonRequest: () => undefined,
    });
    const backend = chain.backend.ethereum.ethereum;
    const ledger = createEthereumSweepLedger();

    const { account } = mockFundedEthereumAddress({
        chain,
        wallet,
        ethereumChain: 'ethereum',
        balance: ONE_ETHER,
        nonce: '3',
    });

    const prepared = await prepareEthereumSweep({ backend, account, destination: DESTINATION });
    if (!prepared.success || !prepared.payload.plan) throw new Error('the plan must compose');

    const sign = (plan: EthereumSweepPlan = prepared.payload.plan!) =>
        signEthereumSweep({ session, backend, ledger, plan });

    return {
        wallet,
        chain,
        device,
        session,
        backend,
        ledger,
        account,
        plan: prepared.payload.plan,
        sign,
        setActivePassphrase: (next: string) => {
            activePassphrase = next;
        },
    };
};

describe('signEthereumSweep', () => {
    it('re-checks the address, signs and records a verified transaction', async () => {
        const { device, ledger, account, plan, sign } = await setup();

        const signed = await sign();

        expect(signed.success).toBe(true);
        if (!signed.success) return;

        expect(parseTransaction(signed.payload.hex)).toMatchObject({
            chainId: 1,
            nonce: 3,
            gasPrice: 24_000_000_000n,
            gas: 21_000n,
            to: DESTINATION.address.toLowerCase(),
            value: BigInt(plan.amount),
        });
        expect(ledger.findSigned(account.address, 3)).toBe(signed.payload);
        expect(ledger.getSignedSweeps()).toEqual([signed.payload]);

        expect(device.calls.map(({ name }) => name)).toEqual([
            'EthereumGetAddress',
            'EthereumSignTx',
            'ButtonAck',
            'ButtonAck',
        ]);
        expect(device.calls[1]?.data).toEqual({
            address_n: account.path,
            nonce: '03',
            gas_price: '059682f000',
            gas_limit: '5208',
            to: '70997970c51812dc3a010c7d01b50e0d17dc79c8',
            // 999496000000000000 wei: 1 ETH minus the fee of 21000 gas at 24 gwei.
            value: '0ddeec51026c8000',
            chain_id: 1,
        });
    });

    it('never sends the same plan to the device twice', async () => {
        const { device, sign } = await setup();
        await sign();
        const callsBefore = device.calls.length;

        expect(await sign()).toEqual({ success: false, error: { type: 'nonce-already-signed' } });
        expect(device.calls).toHaveLength(callsBefore);
    });

    it('refuses a plan that reached the device even when it was not signed', async () => {
        const { device, sign } = await setup({ deviceParams: { isOutputRejected: true } });

        const rejected = await sign();
        expect(rejected).toMatchObject({
            success: false,
            error: { type: 'failure', code: 'Failure_ActionCancelled' },
        });
        // Nothing is left half done on the device.
        expect(device.calls.map(({ name }) => name).slice(-2)).toEqual(['ButtonAck', 'Initialize']);

        const callsBefore = device.calls.length;
        expect(await sign()).toEqual({ success: false, error: { type: 'plan-already-attempted' } });
        expect(device.calls).toHaveLength(callsBefore);
    });

    it.each<['nonce' | 'balance' | 'in-flight', Partial<AccountInfo>]>([
        ['nonce', { misc: { nonce: '4' } }],
        ['balance', { balance: '999999999999999999' }],
        ['in-flight', { history: { total: 2, unconfirmed: 1, transactions: [] } }],
    ])('refuses to sign when the backend now reports a different %s', async (reason, overrides) => {
        const { chain, device, account, sign } = await setup();
        chain.setEthereumAccountInfo('ethereum', account.address, overrides);

        expect(await sign()).toEqual({
            success: false,
            error: { type: 'account-changed', reason },
        });
        expect(device.calls).toHaveLength(0);
    });

    it('refuses to sign when the device now derives a different address', async () => {
        const { device, session, sign, setActivePassphrase } = await setup({
            deviceParams: { hasPassphraseProtection: true },
            passphrase: 'scanned',
            otherWallets: { other: mockWallet('bb'.repeat(16)) },
        });
        // Another passphrase has been in use since the scan: the device holds another wallet.
        setActivePassphrase('other');
        await session.call('Initialize', 'Features');

        expect(await sign()).toEqual({ success: false, error: { type: 'address-mismatch' } });
        expect(device.countCalls('EthereumSignTx')).toBe(0);
    });

    it('discards a signature that does not produce the planned transaction', async () => {
        const { ledger, account, sign } = await setup({
            deviceParams: { isSignedAmountAltered: true },
        });

        expect(await sign()).toEqual({
            success: false,
            error: {
                type: 'signed-transaction-invalid',
                reason: 'signed by a different address',
            },
        });
        expect(ledger.findSigned(account.address, 3)).toBeUndefined();
    });

    it('refuses a device that asks for transaction data and resets it', async () => {
        const { device, sign } = await setup({
            interceptCall: answerSignTxWith({ data_length: 1024 }),
        });

        expect(await sign()).toEqual({
            success: false,
            error: { type: 'unexpected-data-request' },
        });
        expect(device.calls.map(({ name }) => name).at(-1)).toBe('Initialize');
    });

    it('refuses an answer without a signature', async () => {
        const { sign } = await setup({
            interceptCall: answerSignTxWith({
                signature_v: 38,
                signature_r: null,
                signature_s: null,
            }),
        });

        expect(await sign()).toEqual({
            success: false,
            error: { type: 'signed-transaction-invalid', reason: 'signature missing' },
        });
    });
});
