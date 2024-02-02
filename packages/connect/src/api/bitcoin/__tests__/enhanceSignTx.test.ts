import { enhanceSignTx } from '../enhanceSignTx';
import { initBlockchain } from '../../../backend/BlockchainLink';

describe('api/bitcoin/enhanceSignTx', () => {
    it('zcash/zcash testnet', () => {
        ['ZEC', 'TAZ'].forEach(shortcut => {
            const coinInfo: any = { shortcut };
            expect(enhanceSignTx({}, coinInfo)).toEqual({
                overwintered: true,
                version: 5,
                version_group_id: 0x26a7270a,
                branch_id: 0xc2d6d0b4,
            });

            expect(enhanceSignTx({ version: 4 }, coinInfo)).toEqual({
                overwintered: true,
                version: 4,
                version_group_id: 0x26a7270a,
                branch_id: 0xc2d6d0b4,
            });

            expect(enhanceSignTx({ version: 4, version_group_id: 1 }, coinInfo)).toEqual({
                overwintered: true,
                version: 4,
                version_group_id: 1,
                branch_id: 0xc2d6d0b4,
            });

            expect(
                enhanceSignTx({ version: 4, version_group_id: 1, branch_id: 1 }, coinInfo),
            ).toEqual({
                overwintered: true,
                version: 4,
                version_group_id: 1,
                branch_id: 1,
            });

            expect(
                enhanceSignTx(
                    { version: 1, version_group_id: 1, branch_id: 1, overwintered: false },
                    coinInfo,
                ),
            ).toEqual({
                overwintered: false,
                version: 1,
                version_group_id: 1,
                branch_id: 1,
            });
        });
    });

    it('zcash branch_id from backend', async () => {
        const coinInfo: any = { shortcut: 'ZEC', blockchainLink: { type: 'blockbook', url: [] } };
        await initBlockchain(coinInfo, () => {});
        expect(enhanceSignTx({}, coinInfo)).toEqual({
            overwintered: true,
            version: 5,
            version_group_id: 0x26a7270a,
            branch_id: 1001, // value from blockchain-link mock
        });
    });

    it('komodo', () => {
        const coinInfo: any = { shortcut: 'KMD' };
        expect(enhanceSignTx({}, coinInfo)).toEqual({
            overwintered: true,
            version: 4,
            version_group_id: 0x892f2085,
            branch_id: 0x76b809bb,
        });

        expect(enhanceSignTx({ version: 3 }, coinInfo)).toEqual({
            overwintered: true,
            version: 3,
            version_group_id: 0x892f2085,
            branch_id: 0x76b809bb,
        });

        expect(enhanceSignTx({ version: 3, version_group_id: 1 }, coinInfo)).toEqual({
            overwintered: true,
            version: 3,
            version_group_id: 1,
            branch_id: 0x76b809bb,
        });

        expect(enhanceSignTx({ version: 3, version_group_id: 1, branch_id: 1 }, coinInfo)).toEqual({
            overwintered: true,
            version: 3,
            version_group_id: 1,
            branch_id: 1,
        });

        expect(
            enhanceSignTx(
                { version: 1, version_group_id: 1, branch_id: 1, overwintered: false },
                coinInfo,
            ),
        ).toEqual({
            overwintered: false,
            version: 1,
            version_group_id: 1,
            branch_id: 1,
        });
    });

    it('koto', () => {
        const coinInfo: any = { shortcut: 'KOTO' };
        expect(enhanceSignTx({}, coinInfo)).toEqual({
            overwintered: true,
            version: 4,
            version_group_id: 0x892f2085,
            branch_id: 0x2bb40e60,
        });

        expect(enhanceSignTx({ version: 3 }, coinInfo)).toEqual({
            overwintered: true,
            version: 3,
            version_group_id: 0x892f2085,
            branch_id: 0x2bb40e60,
        });

        expect(enhanceSignTx({ version: 3, version_group_id: 1 }, coinInfo)).toEqual({
            overwintered: true,
            version: 3,
            version_group_id: 1,
            branch_id: 0x2bb40e60,
        });

        expect(enhanceSignTx({ version: 3, version_group_id: 1, branch_id: 1 }, coinInfo)).toEqual({
            overwintered: true,
            version: 3,
            version_group_id: 1,
            branch_id: 1,
        });

        expect(
            enhanceSignTx(
                { version: 1, version_group_id: 1, branch_id: 1, overwintered: false },
                coinInfo,
            ),
        ).toEqual({
            overwintered: false,
            version: 1,
            version_group_id: 1,
            branch_id: 1,
        });
    });

    it('peercoin', () => {
        ['PPC', 'tPPC'].forEach(shortcut => {
            const coinInfo: any = { shortcut };
            const options = enhanceSignTx({}, coinInfo);
            expect(options).toEqual({ timestamp: expect.any(Number) });
            expect(options.timestamp! > 0).toBeTruthy();

            expect(enhanceSignTx({ timestamp: 100 }, coinInfo)).toEqual({
                timestamp: 100,
            });
        });
    });

    it('unrecognized coinInfo', () => {
        expect(enhanceSignTx({ expiry: 1 }, {} as any)).toEqual({ expiry: 1 });
    });
});
