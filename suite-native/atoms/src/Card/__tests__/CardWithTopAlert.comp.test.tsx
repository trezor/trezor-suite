import { Text } from 'react-native';

import { renderWithBasicProvider } from '@suite-native/test-utils';

import { CardWithTopAlert } from '../CardWithTopAlert';

describe('CardWithTopAlert', () => {
    const renderComponent = (alertProps: any) => {
        return renderWithBasicProvider(
            <CardWithTopAlert alertProps={alertProps}>
                <Text>hello</Text>
            </CardWithTopAlert>
        );
    };

    it('should render children and alert', () => {
        const { getByText, getByTestId } = renderComponent({
            title: 'alert message',
            variant: 'info',
        });

        expect(getByText('hello')).toBeTruthy();
        expect(getByText('alert message')).toBeTruthy();
        expect(getByTestId('@atom/card/alert/top')).toBeTruthy();
    });

    it('should always render alert at top position', () => {
        const { getByTestId, queryByTestId } = renderComponent({
            title: 'alert message',
            variant: 'warning',
        });

        expect(getByTestId('@atom/card/alert/top')).toBeTruthy();
        expect(queryByTestId('@atom/card/alert/bottom')).toBeNull();
    });
});