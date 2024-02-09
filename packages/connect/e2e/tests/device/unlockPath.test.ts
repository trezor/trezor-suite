import TrezorConnect from '../../../src';

const { getController, setup, conditionalTest, initTrezorConnect } = global.Trezor;
const { ADDRESS_N } = global.TestUtils;

const controller = getController('unlockPath');

describe('TrezorConnect.unlockPath', () => {
    beforeAll(async () => {
        await setup(controller, {
            mnemonic: 'mnemonic_all',
        });
        await initTrezorConnect(controller);
    });

    afterAll(async () => {
        controller.dispose();
        await TrezorConnect.dispose();
    });

    conditionalTest(['1', '<2.5.3'], 'Unlock SLIP-25 + getAddress', async () => {
        const unlockPath = await TrezorConnect.unlockPath({
            path: "m/10025'",
        });
        if (!unlockPath.success) throw new Error(unlockPath.payload.error);

        expect(unlockPath.payload).toMatchObject({
            address_n: [2147493673],
            mac: 'b25e9eff5c4ae63ff5526984ddd94e66872c94d48be1133bd978e59be7e29ead',
        });

        const address = await TrezorConnect.getAddress({
            path: "m/10025'/1'/0'/1'/0/0",
            unlockPath: unlockPath.payload,
            coin: 'Testnet',
        });

        expect(address.payload).toMatchObject({
            address: 'tb1pl3y9gf7xk2ryvmav5ar66ra0d2hk7lhh9mmusx3qvn0n09kmaghqh32ru7',
        });

        const address2 = await TrezorConnect.getAddress({
            path: "m/10025'/1'/0'/1'/0/1",
            unlockPath: unlockPath.payload,
            coin: 'Testnet',
        });

        expect(address2.payload).toMatchObject({
            address: 'tb1p64rqq64rtt7eq6p0htegalcjl2nkjz64ur8xsclc59s5845jty7skp2843',
        });

        // Bundle of unlocked addresses
        const bundle = await TrezorConnect.getAddress({
            bundle: [
                {
                    path: "m/10025'/1'/0'/1'/0/0",
                    unlockPath: unlockPath.payload,
                    showOnTrezor: false,
                    coin: 'Testnet',
                },
                {
                    path: "m/10025'/1'/0'/1'/0/1",
                    unlockPath: unlockPath.payload,
                    showOnTrezor: false,
                    coin: 'Testnet',
                },
            ],
        });

        expect(bundle.payload).toMatchObject([
            {
                address: 'tb1pl3y9gf7xk2ryvmav5ar66ra0d2hk7lhh9mmusx3qvn0n09kmaghqh32ru7',
            },
            {
                address: 'tb1p64rqq64rtt7eq6p0htegalcjl2nkjz64ur8xsclc59s5845jty7skp2843',
            },
        ]);

        // Ensure that the SLIP-0025 internal chain is inaccessible even with user authorization.
        const changeAddress = await TrezorConnect.getAddress({
            path: "m/10025'/1'/0'/1'/1/1",
            unlockPath: unlockPath.payload,
            coin: 'Testnet',
        });
        expect(changeAddress.payload).toMatchObject({ error: 'Forbidden key path' });

        // Ensure that another SLIP-0025 account is inaccessible with the same MAC.
        const otherAccount = await TrezorConnect.getAddress({
            path: "m/10025'/1'/1'/1'/0/0",
            unlockPath: unlockPath.payload,
            coin: 'Testnet',
        });
        expect(otherAccount.payload).toMatchObject({ error: 'Forbidden key path' });
    });

    conditionalTest(['1', '<2.5.3'], 'Unlock SLIP-25 + getPublicKey', async () => {
        const unlockPath = await TrezorConnect.unlockPath({
            path: "m/10025'",
        });
        if (!unlockPath.success) throw new Error(unlockPath.payload.error);

        expect(unlockPath.payload).toMatchObject({
            address_n: [2147493673],
            mac: 'b25e9eff5c4ae63ff5526984ddd94e66872c94d48be1133bd978e59be7e29ead',
        });

        const unlockedPublicKey = await TrezorConnect.getPublicKey({
            path: "m/10025'/1'/0'/1'",
            unlockPath: unlockPath.payload,
            coin: 'Testnet',
        });

        expect(unlockedPublicKey.payload).toMatchObject({
            xpub: 'tpubDEMKm4M3S2Grx5DHTfbX9et5HQb9KhdjDCkUYdH9gvVofvPTE6yb2MH52P9uc4mx6eFohUmfN1f4hhHNK28GaZnWRXr3b8KkfFcySo1SmXU',
            xpubSegwit: `tr([5c9e228d/10025'/1'/0'/1']tpubDEMKm4M3S2Grx5DHTfbX9et5HQb9KhdjDCkUYdH9gvVofvPTE6yb2MH52P9uc4mx6eFohUmfN1f4hhHNK28GaZnWRXr3b8KkfFcySo1SmXU/<0;1>/*)`,
        });

        // Bundle of unlocked xpubs
        const bundle = await TrezorConnect.getPublicKey({
            bundle: [
                {
                    path: "m/10025'/1'/0'/1'",
                    unlockPath: unlockPath.payload,
                    showOnTrezor: true,
                    coin: 'Testnet',
                },
                {
                    path: "m/10025'/1'/1'/1'",
                    unlockPath: unlockPath.payload,
                    showOnTrezor: true,
                    coin: 'Testnet',
                },
            ],
        });

        expect(bundle.payload).toMatchObject([
            {
                xpub: 'tpubDEMKm4M3S2Grx5DHTfbX9et5HQb9KhdjDCkUYdH9gvVofvPTE6yb2MH52P9uc4mx6eFohUmfN1f4hhHNK28GaZnWRXr3b8KkfFcySo1SmXU',
                xpubSegwit: `tr([5c9e228d/10025'/1'/0'/1']tpubDEMKm4M3S2Grx5DHTfbX9et5HQb9KhdjDCkUYdH9gvVofvPTE6yb2MH52P9uc4mx6eFohUmfN1f4hhHNK28GaZnWRXr3b8KkfFcySo1SmXU/<0;1>/*)`,
            },
            {
                xpub: 'tpubDEJLCjatfgyLNnuPyZFctb2j7MgJQgEVmbdjgAZyxhiFsA8mZBYg9R8J1ju2HL7sEAXbr6qWtpLnTL5c48x3B48HcBEXALrjEbdsRp9QJ5R',
                xpubSegwit:
                    "tr([5c9e228d/10025'/1'/1'/1']tpubDEJLCjatfgyLNnuPyZFctb2j7MgJQgEVmbdjgAZyxhiFsA8mZBYg9R8J1ju2HL7sEAXbr6qWtpLnTL5c48x3B48HcBEXALrjEbdsRp9QJ5R/<0;1>/*)",
            },
        ]);

        const forbiddenPublicKey = await TrezorConnect.getPublicKey({
            path: "m/10025'/1'/0'/1'",
            coin: 'Testnet',
        });

        expect(forbiddenPublicKey.payload).toMatchObject({ error: 'Forbidden key path' });
    });

    conditionalTest(['1', '<2.5.3'], 'Unlock SLIP-25 + signTransaction', async () => {
        const unlockPath = await TrezorConnect.unlockPath({
            path: "m/10025'",
        });
        if (!unlockPath.success) throw new Error(unlockPath.payload.error);

        expect(unlockPath.payload).toMatchObject({
            address_n: [2147493673],
            mac: 'b25e9eff5c4ae63ff5526984ddd94e66872c94d48be1133bd978e59be7e29ead',
        });

        const params = {
            inputs: [
                {
                    // address_n: "m/10025'/1'/0'/1'/1/0",
                    address_n: ADDRESS_N("m/10025'/1'/0'/1'/1/0"),
                    amount: 7289000,
                    prev_hash: 'f982c0a283bd65a59aa89eded9e48f2a3319cb80361dfab4cf6192a03badb60a',
                    prev_index: 1,
                    script_type: 'SPENDTAPROOT' as const,
                },
            ],
            outputs: [
                // Our change output.
                {
                    // tb1pchruvduckkwuzm5hmytqz85emften5dnmkqu9uhfxwfywaqhuu0qjggqyp
                    // address_n: "m/10025'/1'/0'/1'/1/2",
                    address_n: ADDRESS_N("m/10025'/1'/0'/1'/1/2"),
                    amount: 7289000 - 50000 - 400,
                    script_type: 'PAYTOTAPROOT' as const,
                },
                // Payment output.
                {
                    address: 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q',
                    amount: 50000,
                    script_type: 'PAYTOADDRESS' as const,
                },
            ],
            coin: 'Testnet',
        };

        const unlockedSignTx = await TrezorConnect.signTransaction({
            ...params,
            unlockPath: unlockPath.payload,
        });

        expect(unlockedSignTx.payload).toMatchObject({
            serializedTx:
                '010000000001010ab6ad3ba09261cfb4fa1d3680cb19332a8fe4d9de9ea89aa565bd83a2c082f90100000000ffffffff02c8736e0000000000225120c5c7c63798b59dc16e97d916011e99da5799d1b3dd81c2f2e93392477417e71e50c30000000000001976a914a579388225827d9f2fe9014add644487808c695d88ac014006bc29900d39570fca291c038551817430965ac6aa26f286483559e692a14a82cfaf8e57610eae12a5af05ee1e9600acb31de4757349c0e3066701aa78f65d2a00000000',
        });

        const forbiddenSignTx = await TrezorConnect.signTransaction(params);
        expect(forbiddenSignTx.payload).toMatchObject({ error: 'Forbidden key path' });
    });
});
