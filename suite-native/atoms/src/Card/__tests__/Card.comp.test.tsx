import React from 'react';
import { Text, View } from 'react-native';

import { renderWithBasicProvider } from '@suite-native/test-utils';

import { Card, CardProps } from '../Card';

describe('Card', () => {
    const renderComponent = (props: Omit<CardProps, 'children'> = {}) => {
        const cardProps = {
            children: <Text>Card content</Text>,
            ...props,
        } as CardProps;

        return renderWithBasicProvider(<Card {...cardProps} />);
    };

    it('should render children prop', () => {
        const { getByText } = renderComponent();
        expect(getByText('Card content')).toBeTruthy();
    });

    it('should render with custom testID', () => {
        const { getByTestId } = renderComponent({ testID: 'custom-card' });
        expect(getByTestId('custom-card')).toBeTruthy();
    });

    it('should render card container with default testID', () => {
        const { getByTestId } = renderComponent();
        expect(getByTestId('@atom/card/content')).toBeTruthy();
    });

    describe('Header and Footer', () => {
        it('should render header when provided', () => {
            const { getByText } = renderComponent({
                header: <Text>Header content</Text>,
            });

            expect(getByText('Header content')).toBeTruthy();
            expect(getByText('Card content')).toBeTruthy();
        });

        it('should render footer when provided', () => {
            const { getByText } = renderComponent({
                footer: <Text>Footer content</Text>,
            });

            expect(getByText('Footer content')).toBeTruthy();
            expect(getByText('Card content')).toBeTruthy();
        });

        it('should render both header and footer when provided', () => {
            const { getByText } = renderComponent({
                header: <Text>Header</Text>,
                footer: <Text>Footer</Text>,
            });

            expect(getByText('Header')).toBeTruthy();
            expect(getByText('Card content')).toBeTruthy();
            expect(getByText('Footer')).toBeTruthy();
        });

        it('should not render header wrapper when header is not provided', () => {
            const { queryByTestId } = renderComponent();

            expect(queryByTestId('@atom/card/header')).toBeNull();
            expect(queryByTestId('@atom/card/content')).toBeTruthy();
        });

        it('should not render footer wrapper when footer is not provided', () => {
            const { queryByTestId } = renderComponent();

            expect(queryByTestId('@atom/card/footer')).toBeNull();
            expect(queryByTestId('@atom/card/content')).toBeTruthy();
        });
    });

    describe('Props', () => {
        it('should accept noPadding prop', () => {
            const { getByText } = renderComponent({ noPadding: true });
            expect(getByText('Card content')).toBeTruthy();
        });

        it('should accept noShadow prop', () => {
            const { getByText } = renderComponent({ noShadow: true });
            expect(getByText('Card content')).toBeTruthy();
        });

        it('should accept borderColor prop', () => {
            const { getByText } = renderComponent({ borderColor: 'borderElevation1' });
            expect(getByText('Card content')).toBeTruthy();
        });

        it('should accept style prop', () => {
            const { getByText } = renderComponent({ style: { marginTop: 20 } });
            expect(getByText('Card content')).toBeTruthy();
        });
    });

    describe('Complex scenarios', () => {
        it('should render with all props combined', () => {
            const { getByTestId, getByText } = renderComponent({
                testID: 'complex-card',
                header: <Text>Complex header</Text>,
                footer: <Text>Complex footer</Text>,
                noPadding: true,
                noShadow: true,
                borderColor: 'borderElevation1',
                style: { marginTop: 10 },
            });

            expect(getByTestId('complex-card')).toBeTruthy();
            expect(getByText('Complex header')).toBeTruthy();
            expect(getByText('Card content')).toBeTruthy();
            expect(getByText('Complex footer')).toBeTruthy();
        });

        it('should render nested components in children', () => {
            const cardProps = {
                children: (
                    <View>
                        <Text>Nested text 1</Text>
                        <Text>Nested text 2</Text>
                    </View>
                ),
            } as CardProps;

            const { getByText } = renderWithBasicProvider(<Card {...cardProps} />);

            expect(getByText('Nested text 1')).toBeTruthy();
            expect(getByText('Nested text 2')).toBeTruthy();
        });

        it('should render complex header and footer content', () => {
            const { getByText } = renderComponent({
                header: (
                    <View>
                        <Text>Header title</Text>
                        <Text>Header subtitle</Text>
                    </View>
                ),
                footer: (
                    <View>
                        <Text>Footer action</Text>
                    </View>
                ),
            });

            expect(getByText('Header title')).toBeTruthy();
            expect(getByText('Header subtitle')).toBeTruthy();
            expect(getByText('Card content')).toBeTruthy();
            expect(getByText('Footer action')).toBeTruthy();
        });
    });

    describe('Edge cases', () => {
        it('should render with empty string children', () => {
            const cardProps = { children: '' } as CardProps;
            const { getByTestId } = renderWithBasicProvider(<Card {...cardProps} />);

            expect(getByTestId('@atom/card/content')).toBeTruthy();
        });

        it('should render with number children', () => {
            const cardProps = { children: <Text>123</Text> } as CardProps;
            const { getByText } = renderWithBasicProvider(<Card {...cardProps} />);

            expect(getByText('123')).toBeTruthy();
        });

        it('should render with null children', () => {
            const cardProps = { children: null } as CardProps;
            const { getByTestId } = renderWithBasicProvider(<Card {...cardProps} />);

            expect(getByTestId('@atom/card/content')).toBeTruthy();
        });

        it('should render with undefined children', () => {
            const cardProps = { children: undefined } as CardProps;
            const { getByTestId } = renderWithBasicProvider(<Card {...cardProps} />);

            expect(getByTestId('@atom/card/content')).toBeTruthy();
        });
    });
});
