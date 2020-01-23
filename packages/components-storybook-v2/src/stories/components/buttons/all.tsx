import React from 'react';
import styled from 'styled-components';
import { Button } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';

const Wrapper = styled.div`
    padding: 20px;
    display: flex;
    flex-wrap: wrap;
`;

const Row = styled.div`
    border-radius: 10px;
    flex: 1;
    border: 4px dashed #00ffff;
    padding: 10px;
    margin: 5px;
    min-width: 200px;
    max-width: 300px;

    > button {
        margin-bottom: 10px;
    }
`;

const variants = ['primary', 'secondary', 'tertiary', 'danger'] as const;
const sizes = ['small', 'large'] as const;

storiesOf('Buttons', module).add(
    'All',
    () => (
        <Wrapper>
            {variants.map(variant => {
                return (
                    <Row>
                        {sizes.map(size => {
                            return (
                                <Button
                                    variant={variant}
                                    size={size}
                                    data-test={`button-${variant}-${size}`}
                                >
                                    {variant[0].toUpperCase()}
                                    {variant.slice(1)} {size}
                                </Button>
                            );
                        })}
                        <Button
                            variant={variant}
                            data-test={`button-${variant}-icon`}
                            icon="PLUS"
                            onClick={() => {
                                console.log('click');
                            }}
                        >
                            {variant[0].toUpperCase()}
                            {variant.slice(1)} icon
                        </Button>
                        <Button
                            variant={variant}
                            data-test={`button-${variant}-icon-right`}
                            icon="PLUS"
                        >
                            {variant[0].toUpperCase()}
                            {variant.slice(1)} icon right
                        </Button>
                        <Button variant={variant} data-test={`button-${variant}-loading`} isLoading>
                            {variant[0].toUpperCase()}
                            {variant.slice(1)} loading
                        </Button>
                        <Button
                            variant={variant}
                            data-test={`button-${variant}-full-width`}
                            fullWidth
                        >
                            {variant[0].toUpperCase()}
                            {variant.slice(1)} full width
                        </Button>
                        <Button
                            variant={variant}
                            isDisabled
                            data-test={`button-${variant}-disabled`}
                            onClick={() => {
                                console.log('click');
                            }}
                        >
                            {variant[0].toUpperCase()}
                            {variant.slice(1)} disabled
                        </Button>
                    </Row>
                );
            })}
        </Wrapper>
    ),
    {
        info: {
            disable: true,
        },
    }
);
