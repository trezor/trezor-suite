import { useSendContext } from '@suite/hooks/wallet/useSendContext';
import React from 'react';
import styled from 'styled-components';

import Address from './components/Address';
import Amount from './components/Amount';
import Header from './components/Header';

const OutputWrapper = styled.div`
    padding: 0 12px 12px 12px;
    margin-bottom: 20px;

    &:last-child {
        margin-bottom: 0;
    }
`;

const Row = styled.div`
    display: flex;
    flex-direction: ${(props: { isColumn?: boolean }) => (props.isColumn ? 'column' : 'row')};
    padding: 0 0 30px 0;

    &:last-child {
        padding: 0;
    }
`;

export default () => {
    const { outputs } = useSendContext();

    return (
        <>
            {outputs.map((output: any) => (
                <OutputWrapper key={output.id}>
                    <Header outputId={output.id} />
                    <Row>
                        <Address outputId={output.id} />
                    </Row>
                    <Row>
                        <Amount outputId={output.id} />
                    </Row>
                </OutputWrapper>
            ))}
        </>
    );
};
