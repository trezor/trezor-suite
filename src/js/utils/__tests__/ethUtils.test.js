import * as ethUtils from '../ethUtils';

it('decimalToHex', () => {
    const input = [0, 1, 2, 100, 999];

    input.forEach((entry) => {
        expect(ethUtils.decimalToHex(entry)).toMatchSnapshot();
    });
});