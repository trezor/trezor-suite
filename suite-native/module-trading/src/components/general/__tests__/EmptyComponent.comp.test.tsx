import { renderWithBasicProvider } from '@suite-native/test-utils';

import { EmptyComponent } from '../EmptyComponent';

describe('EmptyComponent', () => {
    it('should render given title and description', () => {
        const { getByText } = renderWithBasicProvider(
            <EmptyComponent title="TITLE" description="DESCRIPTION" />,
        );

        expect(getByText('TITLE')).toBeTruthy();
        expect(getByText('DESCRIPTION')).toBeTruthy();
    });
});
