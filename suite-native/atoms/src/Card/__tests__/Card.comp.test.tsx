import { Text } from 'react-native';

import { render } from '@suite-native/test-utils';

import { Card, CardProps } from '../Card';

describe('Card', () => {
    const renderComponent = (props: Omit<CardProps, 'children'>) => {
        const cardProps = {
            children: <Text>hello</Text>,
            ...props,
        } as CardProps;

        return render(<Card {...cardProps} />);
    };

    it('should render children prop', () => {
        const { getByText } = renderComponent({});

        expect(getByText('hello')).toBeDefined();
    });

    it('should render children and alert, when alert props are specified', () => {
        const { getByText } = renderComponent({ alertTitle: 'alert', alertVariant: 'info' });

        expect(getByText('hello')).toBeDefined();
        expect(getByText('alert')).toBeDefined();
    });
});
