import { enhanceSignTx } from './enhanceSignTx';
import { initBlockchain } from '../../backend/BlockchainLink';

describe('api/bitcoin/enhanceSignTx', () => {
    it('zcash/zcash testnet', () => {
        ['ZEC', 'TAZ'].forEach(shortcut => {
            const coinInfo: any = { shortcut };
            expect(enhanceSignTx({}, coinInfo)).toEqual({
                overwintered: true,
                version: 5,
                version_group_id: 0x26a7270a,
                branch_id: 0x37a5165b,
            });

            expect(enhanceSignTx({ version: 4 }, coinInfo)).toEqual({
                overwintered: true,
                version: 4,
                version_group_id: 0x26a7270a,
                branch_id: 0x37a5165b,
            });

            expect(enhanceSignTx({ version: 4, version_group_id: 1 }, coinInfo)).toEqual({
                overwintered: true,
                version: 4,
                version_group_id: 1,
                branch_id: 0x37a5165b,
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

    it('zcash branch_id from backend takes precedence over fallback', async () => {
        const coinInfo: any = { shortcut: 'ZEC', blockchainLink: { type: 'blockbook', url: [] } };
        await initBlockchain(coinInfo, () => {});
        // backend consensusBranchId (1001) must override the hardcoded fallback
        expect(enhanceSignTx({}, coinInfo).branch_id).toBe(1001);
    });

    it('zcash branch_id explicit option takes precedence over backend', async () => {
        const coinInfo: any = { shortcut: 'ZEC', blockchainLink: { type: 'blockbook', url: [] } };
        await initBlockchain(coinInfo, () => {});
        expect(enhanceSignTx({ branch_id: 42 }, coinInfo).branch_id).toBe(42);
    });

    it('unrecognized coinInfo', () => {
        expect(enhanceSignTx({ expiry: 1 }, {} as any)).toEqual({ expiry: 1 });
    });
});
