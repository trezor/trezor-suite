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

const Heading = styled.h2``;

storiesOf('Buttons', module).add(
    'All',
    () => {
        return (
            <Wrapper>
                <Heading>Primary</Heading>
                <Row>
                    <ButtonWrapper>
                        <Button size="small" data-test="button-primary-small">
                            Button small
                        </Button>
                    </ButtonWrapper>
                    <ButtonWrapper>
                        <Button data-test="button-primary">Button</Button>
                    </ButtonWrapper>
                    <ButtonWrapper>
                        <Button size="large" data-test="button-primary-large">
                            Button large
                        </Button>
                    </ButtonWrapper>
                    <ButtonWrapper>
                        <Button data-test="button-primary-disabled" disabled>
                            Button disabled
                        </Button>
                    </ButtonWrapper>
                </Row>
                <Heading>Secondary</Heading>
                <Row>
                    <ButtonWrapper>
                        <Button variant="secondary" size="small" data-test="button-secondary-small">
                            Button small
                        </Button>
                    </ButtonWrapper>
                    <ButtonWrapper>
                        <Button variant="secondary" data-test="button-secondary">
                            Button
                        </Button>
                    </ButtonWrapper>
                    <ButtonWrapper>
                        <Button variant="secondary" size="large" data-test="button-secondary-large">
                            Button large
                        </Button>
                    </ButtonWrapper>
                    <ButtonWrapper>
                        <Button variant="secondary" data-test="button-secondary-disabled" disabled>
                            Disabled
                        </Button>
                    </ButtonWrapper>
                </Row>
            </Wrapper>
        );
    },
    {
        info: {
            disable: true,
        },
    }
);
