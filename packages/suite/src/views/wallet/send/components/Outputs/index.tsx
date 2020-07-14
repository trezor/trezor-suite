import React from 'react';
import styled, { css } from 'styled-components';
import { useSendFormContext } from '@wallet-hooks';
import Address from './components/Address';
import Amount from './components/Amount';
import { colors } from '@trezor/components';

const Wrapper = styled.div``;

const OutputWrapper = styled.div<{ index: number }>`
    margin: 32px 42px;
    margin-bottom: 20px;

    &:last-child {
        margin-bottom: 0;
    }

    ${props =>
        props.index > 0 &&
        css`
            margin: 0 42px;
            padding-top: 32px;
            border-top: 1px solid ${colors.NEUE_BG_GRAY};
        `}
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
            {outputs.map((output, index) => (
                <OutputWrapper key={output.id} index={index}>
                    <Row>
                        <Address outputId={index} outputsCount={outputs.length} />
                    </Row>
                    <Row>
                        <Amount outputId={index} />
                    </Row>
                </OutputWrapper>
            ))}
        </Wrapper>
    );
};
