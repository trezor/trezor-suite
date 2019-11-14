import React from 'react';
import styled from 'styled-components';
import { Input } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';

const Wrapper = styled.div`
    padding: 2rem;
`;

const Col = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
    margin: 1rem 0 2rem;
    width: 200px;
`;

const Heading = styled.h2``;

storiesOf('Form', module).add(
    'All',
    () => {
        return (
            <Wrapper>
                <Heading>Input</Heading>
                <Col>
                    <Input />
                    <Input variant="small" />
                    <Input disabled />
                </Col>
            </Wrapper>
        );
    },
    {
        info: {
            disable: true,
        },
    }
);
