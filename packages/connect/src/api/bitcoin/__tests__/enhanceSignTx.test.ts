import { initBlockchain } from '../../../backend/BlockchainLink';
import { enhanceSignTx } from '../enhanceSignTx';

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

    it('unrecognized coinInfo', () => {
        expect(enhanceSignTx({ expiry: 1 }, {} as any)).toEqual({ expiry: 1 });
    });
});
