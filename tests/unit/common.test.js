import * as common from '../../src/workers/common';

describe('Common:', () => {
    it('add unique address', () => {
        const data = [
            'not-an-array',
            {},
            new Error('error'),
            ['A', 'A', 'A', { invalid: 'value' }],
            ['A', 'B', 'A', false],
            ['A', 'B', 'C', 'A', 'D'],
        ];
        data.forEach((item) => {
            expect(common.addAddresses(item)).toMatchSnapshot();
        });
    });

    it('remove address from the list', () => {
        const data = [
            'not-an-array',
            ['A', undefined],
            ['B', 'B', 'B'],
            ['C', {}, 'D'],
        ];
        data.forEach((item) => {
            expect(common.removeAddresses(item)).toMatchSnapshot();
        });
    });
});