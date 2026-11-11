import { applyZcashSignTxDefaultsIfZcash } from './applyZcashSignTxDefaultsIfZcash';

describe(applyZcashSignTxDefaultsIfZcash.name, () => {
    it('zcash/zcash testnet', () => {
        ['ZEC', 'TAZ'].forEach(shortcut => {
            const coinInfo: any = { shortcut };
            expect(applyZcashSignTxDefaultsIfZcash({}, coinInfo)).toEqual({
                overwintered: true,
                version: 5,
                version_group_id: 0x26a7270a,
                branch_id: 0x77190ad9,
            });

            expect(applyZcashSignTxDefaultsIfZcash({ version: 4 }, coinInfo)).toEqual({
                overwintered: true,
                version: 4,
                version_group_id: 0x26a7270a,
                branch_id: 0x77190ad9,
            });

            expect(
                applyZcashSignTxDefaultsIfZcash({ version: 4, version_group_id: 1 }, coinInfo),
            ).toEqual({
                overwintered: true,
                version: 4,
                version_group_id: 1,
                branch_id: 0x77190ad9,
            });

            expect(
                applyZcashSignTxDefaultsIfZcash(
                    { version: 4, version_group_id: 1, branch_id: 1 },
                    coinInfo,
                ),
            ).toEqual({
                overwintered: true,
                version: 4,
                version_group_id: 1,
                branch_id: 1,
            });

            expect(
                applyZcashSignTxDefaultsIfZcash(
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

    it('unrecognized coinInfo', () => {
        expect(applyZcashSignTxDefaultsIfZcash({ expiry: 1 }, {} as any)).toEqual({ expiry: 1 });
    });
});
