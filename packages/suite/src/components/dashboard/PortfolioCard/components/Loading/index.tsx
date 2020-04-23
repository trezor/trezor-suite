import React from 'react';
import styled from 'styled-components';
import { colors, variables, Loader } from '@trezor/components';
import { Translation } from '@suite-components';

const Wrapper = styled.div`
    display: flex;
    padding: 20px 0px;
    align-items: center;
`;

const Title = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.BLACK0};
    margin-left: 12px;
`;

type Props = React.HTMLAttributes<HTMLDivElement>;

export default (props: Props) => {
    return (
        <Wrapper {...props} data-test="@dashboard/loading">
            <Loader size={20} />
            <Title>
                <Translation id="TR_LOADING_WALLET" />
            </Title>
        </Wrapper>
    );
};
