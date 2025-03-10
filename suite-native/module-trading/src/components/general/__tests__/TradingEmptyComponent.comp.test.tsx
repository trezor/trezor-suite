import { render } from '@suite-native/test-utils';

import { TradingEmptyComponent } from '../TradingEmptyComponent';

describe('TradingEmptyComponent', () => {
    it('should render given title and description', () => {
        const { getByText } = render(
            <TradingEmptyComponent title="TITLE" description="DESCRIPTION" />,
        );

        expect(getByText('TITLE')).toBeDefined();
        expect(getByText('DESCRIPTION')).toBeDefined();
    });
});
