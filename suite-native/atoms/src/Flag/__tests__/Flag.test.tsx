import { renderWithBasicProvider } from '@suite-native/test-utils';

import { Flag } from '../Flag';

describe('Flag component', () => {
    it('should display the correct flag for a valid country code', () => {
        const { getByLabelText } = renderWithBasicProvider(<Flag country="CZ" />);

        expect(getByLabelText('flag-CZ')).toBeTruthy();
    });
});
