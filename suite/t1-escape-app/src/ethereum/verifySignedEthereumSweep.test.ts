import { type Hex, keccak256, parseTransaction, serializeTransaction } from 'viem';
import { sign } from 'viem/accounts';

import type { EthereumSweepPlan } from './composeEthereumSweep';
import { getEthereumAddressPath } from './ethereumChain';
import { type EthereumSignature, verifySignedEthereumSweep } from './verifySignedEthereumSweep';
import { mockWallet } from '../../mocks/mockWallet';

const wallet = mockWallet();

const PATH = getEthereumAddressPath(60, 0);

const DESTINATION = { address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as const };

const plan: EthereumSweepPlan = {
    account: {
        chain: 'ethereum',
        slip44: 60,
        index: 0,
        path: PATH,
        address: wallet.getEthereumAddress(PATH),
    },
    chainId: 1,
    nonce: 3,
    balance: '1000000000000000000',
    gasPrice: '24000000000',
    gasLimit: '21000',
    fee: '504000000000000',
    amount: '999496000000000000',
    destination: DESTINATION,
};

type SignPlanParams = {
    privateKey: Hex;
    value?: bigint;
    chainId?: number;
};

/** Signs the EIP-155 hash of the plan the way the firmware does, returning its `v`, `r`, `s`. */
const signPlan = async ({
    privateKey,
    value = BigInt(plan.amount),
    chainId = plan.chainId,
}: SignPlanParams): Promise<EthereumSignature> => {
    const hash = keccak256(
        serializeTransaction({
            type: 'legacy',
            chainId,
            nonce: plan.nonce,
            gasPrice: BigInt(plan.gasPrice),
            gas: BigInt(plan.gasLimit),
            to: plan.destination.address,
            value,
        }),
    );
    const { r, s, yParity } = await sign({ hash, privateKey, to: 'object' });
    if (yParity === undefined) throw new Error('signature without recovery id');

    return { v: yParity + 2 * chainId + 35, r: r.slice(2), s: s.slice(2) };
};

describe('verifySignedEthereumSweep', () => {
    it('accepts a signature by the address being emptied and returns the parsable transaction', async () => {
        const signature = await signPlan({ privateKey: wallet.getPrivateKey(PATH) });

        const verified = await verifySignedEthereumSweep({ plan, signature });

        expect(verified.success).toBe(true);
        if (!verified.success) return;

        expect(parseTransaction(verified.payload.hex)).toMatchObject({
            type: 'legacy',
            chainId: 1,
            nonce: 3,
            gasPrice: 24000000000n,
            gas: 21000n,
            to: DESTINATION.address.toLowerCase(),
            value: 999496000000000000n,
        });
        expect(verified.payload.txid).toBe(keccak256(verified.payload.hex));
    });

    it('refuses a signature made by another key', async () => {
        const signature = await signPlan({
            privateKey: wallet.getPrivateKey(getEthereumAddressPath(60, 1)),
        });

        expect(await verifySignedEthereumSweep({ plan, signature })).toEqual({
            success: false,
            error: {
                type: 'signed-transaction-invalid',
                reason: 'signed by a different address',
            },
        });
    });

    it('refuses a signature over a transaction with a different amount', async () => {
        const signature = await signPlan({
            privateKey: wallet.getPrivateKey(PATH),
            value: BigInt(plan.amount) - 1n,
        });

        expect(await verifySignedEthereumSweep({ plan, signature })).toMatchObject({
            success: false,
            error: { reason: 'signed by a different address' },
        });
    });

    it('refuses a v that does not encode the planned chain', async () => {
        const signature = await signPlan({ privateKey: wallet.getPrivateKey(PATH), chainId: 61 });

        expect(await verifySignedEthereumSweep({ plan, signature })).toEqual({
            success: false,
            error: {
                type: 'signed-transaction-invalid',
                reason: 'signature v does not encode the chain',
            },
        });
    });

    it.each([
        ['empty r', { r: '' }],
        ['too long s', { s: 'ab'.repeat(33) }],
        ['non-hex r', { r: 'zz'.repeat(32) }],
    ])('refuses a signature with %s', async (_description, overrides) => {
        const signature = {
            ...(await signPlan({ privateKey: wallet.getPrivateKey(PATH) })),
            ...overrides,
        };

        expect(await verifySignedEthereumSweep({ plan, signature })).toEqual({
            success: false,
            error: {
                type: 'signed-transaction-invalid',
                reason: 'signature components are not 32-byte numbers',
            },
        });
    });
});
