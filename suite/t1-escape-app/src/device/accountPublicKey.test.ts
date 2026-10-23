import { bip32 } from '@trezor/utxo-lib';

import { getAccountPublicKey } from './accountPublicKey';
import { createDeviceSession } from './deviceSession';
import { mockDevice } from '../../mocks/mockDevice';
import { mockWallet } from '../../mocks/mockWallet';
import type { AccountType } from '../bitcoin/accountType';
import { BITCOIN_NETWORK } from '../bitcoin/bitcoinNetwork';

const setup = (wallet = mockWallet()) => {
    const device = mockDevice({ wallets: { '': wallet } });
    const session = createDeviceSession({
        transportCall: device.transportCall,
        getDeviceLostReason: () => undefined,
        requestPin: () => Promise.resolve(undefined),
        requestPassphrase: () => Promise.resolve(undefined),
        onButtonRequest: () => undefined,
    });

    return { device, session, wallet };
};

describe('getAccountPublicKey', () => {
    it.each<[AccountType, string, string]>([
        ['p2pkh', 'xpub', "m/44'/0'/0'"],
        ['p2sh', 'ypub', "m/49'/0'/0'"],
        ['p2wpkh', 'zpub', "m/84'/0'/0'"],
    ])(
        'builds the %s descriptor with the %s prefix although the device says xpub',
        async (accountType, prefix) => {
            const { session, wallet } = setup();

            const result = await getAccountPublicKey({
                call: session.call,
                accountType,
                accountIndex: 0,
            });

            expect(result).toMatchObject({
                success: true,
                payload: { accountType, accountIndex: 0, xpub: wallet.getAccountXpub(accountType) },
            });
            expect(result.success && result.payload.xpub.startsWith('xpub')).toBe(true);
            expect(result.success && result.payload.descriptor.startsWith(prefix)).toBe(true);
        },
    );

    it('keeps the key material when it changes the prefix', async () => {
        const { session } = setup();

        const result = await getAccountPublicKey({
            call: session.call,
            accountType: 'p2wpkh',
            accountIndex: 2,
        });
        if (!result.success) throw new Error('expected success');

        const fromXpub = bip32.fromBase58(result.payload.xpub, BITCOIN_NETWORK);
        const fromDescriptor = bip32.fromBase58(result.payload.descriptor, {
            ...BITCOIN_NETWORK,
            bip32: { ...BITCOIN_NETWORK.bip32, public: 0x04b24746 },
        });

        expect(fromDescriptor.publicKey).toEqual(fromXpub.publicKey);
        expect(fromDescriptor.chainCode).toEqual(fromXpub.chainCode);
        expect(result.payload.path).toEqual([0x80000054, 0x80000000, 0x80000002]);
    });

    it('requests the account key and its first child, without a script type', async () => {
        const { session, device } = setup();

        await getAccountPublicKey({ call: session.call, accountType: 'p2sh', accountIndex: 1 });

        expect(device.calls).toEqual([
            { name: 'GetPublicKey', data: { address_n: [0x80000031, 0x80000000, 0x80000001] } },
            { name: 'GetPublicKey', data: { address_n: [0x80000031, 0x80000000, 0x80000001, 0] } },
        ]);
    });

    it('rejects a key whose serialization does not match its node', async () => {
        const { session, device, wallet } = setup();
        const other = mockWallet('ff'.repeat(16));
        jest.spyOn(wallet, 'getPublicKey').mockImplementationOnce(path => ({
            ...wallet.getPublicKey(path),
            xpub: other.getPublicKey(path).xpub,
        }));

        expect(
            await getAccountPublicKey({
                call: session.call,
                accountType: 'p2pkh',
                accountIndex: 0,
            }),
        ).toEqual({ success: false, error: { type: 'public-key-invalid' } });
        expect(device.countCalls('GetPublicKey')).toBe(2);
    });

    it('rejects an account key that does not derive the child key', async () => {
        const { session, wallet } = setup();
        const other = mockWallet('ff'.repeat(16));
        jest.spyOn(wallet, 'getPublicKey')
            .mockImplementationOnce(path => other.getPublicKey(path))
            .mockImplementationOnce(path => mockWallet().getPublicKey(path));

        expect(
            await getAccountPublicKey({
                call: session.call,
                accountType: 'p2pkh',
                accountIndex: 0,
            }),
        ).toEqual({ success: false, error: { type: 'public-key-invalid' } });
    });

    it('rejects a key of a different account than the requested one', async () => {
        const { session, wallet } = setup();
        const original = mockWallet();
        // The device answers consistently, but for account 5 instead of account 0.
        jest.spyOn(wallet, 'getPublicKey').mockImplementation(path =>
            original.getPublicKey(path.with(2, 0x80000005)),
        );

        expect(
            await getAccountPublicKey({
                call: session.call,
                accountType: 'p2pkh',
                accountIndex: 0,
            }),
        ).toEqual({ success: false, error: { type: 'public-key-invalid' } });
    });

    it('passes a device failure through', async () => {
        const device = mockDevice({ wallets: { '': mockWallet() }, pin: '12' });
        const session = createDeviceSession({
            transportCall: device.transportCall,
            getDeviceLostReason: () => undefined,
            requestPin: () => Promise.resolve('99'),
            requestPassphrase: () => Promise.resolve(undefined),
            onButtonRequest: () => undefined,
        });

        expect(
            await getAccountPublicKey({
                call: session.call,
                accountType: 'p2pkh',
                accountIndex: 0,
            }),
        ).toEqual({
            success: false,
            error: { type: 'failure', code: 'Failure_PinInvalid', message: 'Invalid PIN' },
        });
        expect(device.countCalls('PinMatrixAck')).toBe(1);
    });
});
