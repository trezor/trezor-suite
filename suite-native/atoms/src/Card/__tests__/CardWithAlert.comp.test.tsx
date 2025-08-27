import { Text } from 'react-native';

import { renderWithBasicProvider } from '@suite-native/test-utils';

import { CardWithAlert } from '../CardWithAlert';

describe('CardWithAlert', () => {
    const renderComponent = (alertPosition: 'top' | 'bottom', alertProps: any) => {
        const testId = alertPosition === 'top' ? '@atom/card/alert/top' : '@atom/card/alert/bottom';
        return renderWithBasicProvider(
            <CardWithAlert
                alertProps={alertProps}
                alertPosition={alertPosition}
                alertTestId={testId}
            >
                <Text>hello</Text>
            </CardWithAlert>
        );
    };

    it('should render children and alert at top position', () => {
        const { getByText, getByTestId } = renderComponent('top', {
            title: 'alert message',
            variant: 'warning',
        });

        expect(getByText('hello')).toBeTruthy();
        expect(getByText('alert message')).toBeTruthy();
        expect(getByTestId('@atom/card/alert/top')).toBeTruthy();
    });

    it('should render children and alert at bottom position', () => {
        const { getByText, getByTestId } = renderComponent('bottom', {
            title: 'alert message',
            variant: 'info',
        });

        expect(getByText('hello')).toBeTruthy();
        expect(getByText('alert message')).toBeTruthy();
        expect(getByTestId('@atom/card/alert/bottom')).toBeTruthy();
    });

    it('should render alert with different variants', () => {
        const { getByText } = renderComponent('top', {
            title: 'critical alert',
            variant: 'critical',
        });

        expect(getByText('critical alert')).toBeTruthy();
    });

    it('should support all card props', () => {
        const { root } = renderComponent('bottom', {
            title: 'test alert',
            variant: 'info',
        });

        expect(root).toBeTruthy();
    });
});