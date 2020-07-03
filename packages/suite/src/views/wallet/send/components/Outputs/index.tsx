import React from 'react';
import styled from 'styled-components';
import { useSendFormContext } from '@wallet-hooks';
import Address from './components/Address';
import Amount from './components/Amount';
import Header from './components/Header';

const Wrapper = styled.div``;

const OutputWrapper = styled.div`
    padding: 32px 42px;
    margin-bottom: 20px;

    &:last-child {
        margin-bottom: 0;
    }
`;

const Row = styled.div`
    display: flex;
    flex-direction: ${(props: { isColumn?: boolean }) => (props.isColumn ? 'column' : 'row')};
    padding: 0 0 10px 0;

    &:last-child {
        padding: 0;
    }
`;

export default () => {
    const { outputs } = useSendFormContext();
    return (
        <Wrapper>
            {outputs.fields.map((output, index) => (
                <OutputWrapper key={output.id}>
                    <Header outputId={index} />
                    <Row>
                        <Address outputId={index} />
                    </Row>
                    <Row>
                        <Amount outputId={index} />
                    </Row>
                </OutputWrapper>
            ))}
        </Wrapper>
    );
};
