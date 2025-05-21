import { Text } from 'react-native';

import { renderWithBasicProvider } from '@suite-native/test-utils';

import { Card, CardProps } from '../Card';

describe('Card', () => {
    const renderComponent = (props: Omit<CardProps, 'children'>) => {
        const cardProps = {
            children: <Text>hello</Text>,
            ...props,
        } as CardProps;

        return renderWithBasicProvider(<Card {...cardProps} />);
    };

    it('should render children prop', () => {
        const { getByText } = renderComponent({});

        expect(getByText('hello')).toBeTruthy();
    });

    it('should render only children if alertProps are not provided, even if alertPosition is set', () => {
        const { queryByTestId, getByText } = renderComponent({ alertPosition: 'bottom' });

        expect(getByText('hello')).toBeTruthy();
        expect(queryByTestId('@atom/card/alert/top')).toBeNull();
        expect(queryByTestId('@atom/card/alert/bottom')).toBeNull();
    });

    it('should render alert only on top when alertPosition is not specified', () => {
        const { getByTestId, getByText, queryByTestId } = renderComponent({
            alertProps: { title: 'alert', variant: 'info' },
        });

        expect(getByText('hello')).toBeTruthy();

        expect(getByText('alert')).toBeTruthy();
        expect(getByTestId('@atom/card/alert/top')).toBeTruthy();
        expect(queryByTestId('@atom/card/alert/bottom')).toBeNull();
    });

    it('should render alert only on top when alertPosition is top', () => {
        const { getByTestId, getByText, queryByTestId } = renderComponent({
            alertProps: { title: 'alert', variant: 'info' },
            alertPosition: 'top',
        });

        expect(getByText('hello')).toBeTruthy();

        expect(getByText('alert')).toBeTruthy();
        expect(getByTestId('@atom/card/alert/top')).toBeTruthy();
        expect(queryByTestId('@atom/card/alert/bottom')).toBeNull();
    });

    it('should render alert only on bottom when alertPosition is bottom', () => {
        const { getByTestId, getByText, queryByTestId } = renderComponent({
            alertProps: { title: 'alert', variant: 'info' },
            alertPosition: 'bottom',
        });

        expect(getByText('hello')).toBeTruthy();

        expect(getByText('alert')).toBeTruthy();
        expect(getByTestId('@atom/card/alert/bottom')).toBeTruthy();
        expect(queryByTestId('@atom/card/alert/top')).toBeNull();
    });

    it('should not reset border radiuses if alert is not present', () => {
        const { queryByTestId } = renderComponent({});

        expect(queryByTestId('@atom/card/alert/top')).toBeNull();
        expect(queryByTestId('@atom/card/alert/bottom')).toBeNull();

        expect(queryByTestId('@atom/card/container')).not.toHaveStyle({ borderTopLeftRadius: 0 });
        expect(queryByTestId('@atom/card/container')).not.toHaveStyle({
            borderBottomLeftRadius: 0,
        });
    });
});
