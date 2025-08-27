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

    it('should not render alert test IDs since alerts are removed from base Card', () => {
        const { queryByTestId, getByText } = renderComponent({});

        expect(getByText('hello')).toBeTruthy();
        expect(queryByTestId('@atom/card/alert/top')).toBeNull();
        expect(queryByTestId('@atom/card/alert/bottom')).toBeNull();
    });

    it('should maintain normal border radiuses without alerts', () => {
        const { queryByTestId } = renderComponent({});

        expect(queryByTestId('@atom/card/alert/top')).toBeNull();
        expect(queryByTestId('@atom/card/alert/bottom')).toBeNull();

        expect(queryByTestId('@atom/card/container')).not.toHaveStyle({ borderTopLeftRadius: 0 });
        expect(queryByTestId('@atom/card/container')).not.toHaveStyle({
            borderBottomLeftRadius: 0,
        });
    });
});
