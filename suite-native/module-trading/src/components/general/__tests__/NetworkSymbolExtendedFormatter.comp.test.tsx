import { render } from '@suite-native/test-utils';

import { NetworkSymbolExtendedFormatter } from '../NetworkSymbolExtendedFormatter';

describe('NetworkSymbolExtendedFormatter', () => {
    it('should render symbol uppercase', () => {
        const { getByText } = render(<NetworkSymbolExtendedFormatter symbol="btc" />);

        expect(getByText('BTC')).toBeDefined();
    });
});
