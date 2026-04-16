import { calculateAssetsPercentage } from '../utils';
import * as fixtures from './fixtures/assets';

describe('calculateAssetsPercentage', () => {
    it('calculateAssetsPercentage - zero balance', () => {
        const assetsWithPercentage = calculateAssetsPercentage(fixtures.assetsFixtureZeroBalance);
        const btc = assetsWithPercentage[0];
        const eth = assetsWithPercentage[1];
        const ltc = assetsWithPercentage[2];

        expect(btc?.fiatPercentage).toBe(0);
        expect(btc?.fiatPercentageOffset).toBe(0);

        expect(eth?.fiatPercentage).toBe(0);
        expect(eth?.fiatPercentageOffset).toBe(0);

        expect(ltc?.fiatPercentage).toBe(0);
        expect(ltc?.fiatPercentageOffset).toBe(0);
    });

    it('calculateAssetsPercentage - with balance', () => {
        const assetsWithPercentage = calculateAssetsPercentage(fixtures.assetsFixtureWithBalance);
        const btc = assetsWithPercentage[0];
        const eth = assetsWithPercentage[1];
        const ltc = assetsWithPercentage[2];

        expect(btc?.fiatPercentage).toBeCloseTo(77.66974942692278);
        expect(btc?.fiatPercentageOffset).toBe(0);

        expect(eth?.fiatPercentage).toBeCloseTo(22.330250573077226);
        expect(eth?.fiatPercentageOffset).toBeCloseTo(77.66974942692278);

        expect(ltc?.fiatPercentage).toBe(0);
        expect(ltc?.fiatPercentageOffset).toBe(0);
    });

    it('calculateAssetsPercentage - single asset', () => {
        const assetsWithPercentage = calculateAssetsPercentage(fixtures.assetsFixtureSingleAsset);
        const btc = assetsWithPercentage[0];

        expect(btc?.fiatPercentage).toBeCloseTo(100);
        expect(btc?.fiatPercentageOffset).toBe(0);
    });
});
