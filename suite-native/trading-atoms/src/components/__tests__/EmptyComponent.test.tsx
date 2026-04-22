import { renderWithProviders } from '@suite-native/test-utils';

import { EmptyComponent } from '../EmptyComponent';

describe('EmptyComponent', () => {
    it('should render given title and description', () => {
        const { getByText } = renderWithProviders(
            <EmptyComponent title="TITLE" description="DESCRIPTION" />,
            { providers: ['intl'] },
        );

        expect(getByText('TITLE')).toBeTruthy();
        expect(getByText('DESCRIPTION')).toBeTruthy();
    });
});
