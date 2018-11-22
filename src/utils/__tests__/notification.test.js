import * as nUtils from 'utils/notification';

describe('device utils', () => {
    it('get status', () => {
        const types = [
            'info',
            'error',
            'warning',
            'success',
            'kdsjflds',
            '',
        ];

        types.forEach((type) => {
            expect(nUtils.getPrimaryColor(type)).toMatchSnapshot();
        });
    });
    it('get icon', () => {
        const types = [
            'info',
            'error',
            'warning',
            'success',
            'kdsjflds',
            '',
        ];

        types.forEach((type) => {
            expect(nUtils.getIcon(type)).toMatchSnapshot();
        });
    });
});
