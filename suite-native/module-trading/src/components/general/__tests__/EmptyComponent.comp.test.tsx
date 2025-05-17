import { renderWithBasicProvider } from '@suite-native/test-utils';

import { TradingEmptyComponent } from '../EmptyComponent';

describe('TradingEmptyComponent', () => {
    it('should render given title and description', () => {
        const { getByText } = renderWithBasicProvider(
            <TradingEmptyComponent title="TITLE" description="DESCRIPTION" />,
        );

        expect(getByText('TITLE')).toBeTruthy();
        expect(getByText('DESCRIPTION')).toBeTruthy();
    });
});
