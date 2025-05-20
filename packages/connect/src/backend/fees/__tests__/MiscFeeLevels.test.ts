import type { CoinInfo } from '../../../types';
import { MiscFeeLevels } from '../MiscFeeLevels';

const SOL_COIN_INFO: CoinInfo = {
    type: 'misc',
    name: 'Solana',
    shortcut: 'SOL',
    label: 'SOL',
    slip44: 501,
    decimals: 9,
    blockTime: 0.4,
    minFee: 5_000,
    maxFee: 1_000_000,
    curve: '',
    defaultFees: [
        {
            label: 'normal',
            blocks: -1,
            feePerUnit: '5000',
        },
    ],
    support: { connect: false, UNKNOWN: false } as any,
};

const HAPPY_RESPONSE = [{ feePerUnit: '8000', feeLimit: '1234' }];
const TOO_LOW_RESPONSE = [{ feePerUnit: '100' }];
const TOO_HIGH_RESPONSE = [{ feePerUnit: '9999999999' }];

const makeBackend = (resp: any) =>
    ({
        estimateFee: jest.fn().mockResolvedValue(resp),
    }) as any;

describe('MiscFeeLevels – Solana', () => {
    const REQUEST = {} as const;

    it('happy-path updates the single "normal" level', async () => {
        const feeLevels = new MiscFeeLevels(SOL_COIN_INFO);
        const backend = makeBackend(HAPPY_RESPONSE);

        const levels = await feeLevels.load(backend, REQUEST);

        expect(levels).toHaveLength(1);
        expect(levels[0]).toMatchObject({
            label: 'normal',
            feePerUnit: '8000',
            feeLimit: '1234',
        });
        expect(feeLevels.wasFetchedSuccessfully).toBe(true);
        expect(backend.estimateFee).toHaveBeenCalledWith(REQUEST);
    });

    it('clamps to minFee and maxFee', async () => {
        // minFee clamp
        const feeMin = new MiscFeeLevels(SOL_COIN_INFO);
        await feeMin.load(makeBackend(TOO_LOW_RESPONSE), REQUEST);
        expect(feeMin.levels[0].feePerUnit).toBe(SOL_COIN_INFO.minFee.toString());

        // maxFee clamp
        const feeMax = new MiscFeeLevels(SOL_COIN_INFO);
        await feeMax.load(makeBackend(TOO_HIGH_RESPONSE), REQUEST);
        expect(feeMax.levels[0].feePerUnit).toBe(SOL_COIN_INFO.maxFee.toString());
    });

    it('keeps default levels when backend throws', async () => {
        const backend = {
            estimateFee: jest.fn().mockRejectedValue(new Error('backend down')),
        } as any;

        const feeLevels = new MiscFeeLevels(SOL_COIN_INFO);
        const original = [...feeLevels.levels];

        const after = await feeLevels.load(backend, REQUEST);

        expect(after).toEqual(original);
        expect(feeLevels.wasFetchedSuccessfully).toBe(false);
    });
});
