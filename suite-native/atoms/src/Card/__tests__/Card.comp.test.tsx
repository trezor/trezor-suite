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

    it('should render children and alert, when alert props are specified', () => {
        const { getByText } = renderComponent({ alertProps: { title: 'alert', variant: 'info' } });

        expect(getByText('hello')).toBeTruthy();
        expect(getByText('alert')).toBeTruthy();
    });
});
