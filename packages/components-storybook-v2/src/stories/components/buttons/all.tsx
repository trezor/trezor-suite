import React from 'react';
import styled from 'styled-components';
import { Button } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';

const Wrapper = styled.div`
    padding: 2rem;
`;

const Row = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin: 1rem 0 2rem;
    width: 400px;
`;

const ButtonWrapper = styled.div`
    margin-bottom: 1rem;
`;

storiesOf('Buttons', module).add(
    'All',
    () => {
        const variants = ['primary', 'secondary'];
        const sizes = ['small', 'medium', 'large'];

        return (
            <Wrapper>
                {variants.map(variant => {
                    return (
                        <Row>
                            {sizes.map(size => {
                                return (
                                    <ButtonWrapper>
                                        <Button
                                            variant={variant as 'primary' | 'secondary'}
                                            size={size as 'small' | 'medium' | 'large'}
                                            data-test={`button-${variant}-${size}`}
                                        >
                                            {variant} {size}
                                        </Button>
                                    </ButtonWrapper>
                                );
                            })}
                            <ButtonWrapper>
                                <Button
                                    variant={variant as 'primary' | 'secondary'}
                                    disabled
                                    data-test={`button-${variant}-disabled`}
                                >
                                    {variant} disabled
                                </Button>
                            </ButtonWrapper>
                        </Row>
                    );
                })}
            </Wrapper>
        );
    },
    {
        info: {
            disable: true,
        },
    }
);
