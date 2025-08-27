import { Text } from 'react-native';

import { renderWithBasicProvider } from '@suite-native/test-utils';

import { CardWithBottomAlert } from '../CardWithBottomAlert';

describe('CardWithBottomAlert', () => {
    const renderComponent = (alertProps: any) => {
        return renderWithBasicProvider(
            <CardWithBottomAlert alertProps={alertProps}>
                <Text>hello</Text>
            </CardWithBottomAlert>
        );
    };

    it('should render children and alert', () => {
        const { getByText, getByTestId } = renderComponent({
            title: 'alert message',
            variant: 'warning',
        });

        expect(getByText('hello')).toBeTruthy();
        expect(getByText('alert message')).toBeTruthy();
        expect(getByTestId('@atom/card/alert/bottom')).toBeTruthy();
    });

    it('should always render alert at bottom position', () => {
        const { getByTestId, queryByTestId } = renderComponent({
            title: 'alert message',
            variant: 'critical',
        });

        expect(getByTestId('@atom/card/alert/bottom')).toBeTruthy();
        expect(queryByTestId('@atom/card/alert/top')).toBeNull();
    });
});