import BigNumber from 'bignumber.js';
import * as ethUtils from '../ethUtils';

describe('eth utils', () => {
    it('decimalToHex', () => {
        const input = [0, 1, 2, 100, 9999999999];

        input.forEach((entry) => {
            expect(ethUtils.decimalToHex(entry)).toMatchSnapshot();
        });
    });

    it('hexToDecimal', () => {
        const input = ['2540be3ff', '64', '2', '1', '0', ''];

        input.forEach((entry) => {
            expect(ethUtils.hexToDecimal(entry)).toMatchSnapshot();
        });
    });

    it('padLeftEven', () => {
        const input = ['2540be3ff'];

        input.forEach((entry) => {
            expect(ethUtils.padLeftEven(entry)).toMatchSnapshot();
        });
    });

    it('sanitizeHex', () => {
        const input = ['0x2540be3ff', '1', '2', '100', '999', ''];

        input.forEach((entry) => {
            expect(ethUtils.sanitizeHex(entry)).toMatchSnapshot();
        });
    });


    it('strip', () => {
        const input = ['0x', '0x2540be3ff', '2540be3ff'];

        input.forEach((entry) => {
            expect(ethUtils.strip(entry)).toMatchSnapshot();
        });
    });

    it('calcGasPrice', () => {
        const input = [{ price: new BigNumber(9898998989), limit: '9' }];

        input.forEach((entry) => {
            expect(ethUtils.calcGasPrice(entry.price, entry.limit)).toMatchSnapshot();
        });
    });
});
