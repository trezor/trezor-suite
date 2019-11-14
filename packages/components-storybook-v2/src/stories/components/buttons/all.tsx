import React from 'react';
import styled from 'styled-components';
import { Button } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';

const Wrapper = styled.div`
    padding: 2rem;
`;

const Row = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
    margin: 1rem 0 2rem;
    width: 200px;
`;

const Heading = styled.h2``;

storiesOf('Buttons', module).add(
    'All',
    () => {
        return (
            <Wrapper>
                <Heading>Primary</Heading>
                <Row>
                    <Button size="small">Label</Button>
                    <Button>Label</Button>
                    <Button size="large">Label</Button>
                </Row>
                <Heading>Secondary</Heading>
                <Row>
                    <Button variant="secondary" size="small">
                        Label
                    </Button>
                    <Button variant="secondary">Label</Button>
                    <Button variant="secondary" size="large">
                        Label
                    </Button>
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
