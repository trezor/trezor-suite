import React from 'react';
import styled from 'styled-components';
import { colors, variables, Spinner } from '@trezor/components';
import { Translation } from '@suite-components';

const Wrapper = styled.div`
    display: flex;
    padding: 20px 0px;
    align-items: center;
    justify-content: center;
    width: 100%;
`;

const Title = styled.div`
    text-align: center;
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.BLACK50};
    margin-left: 12px;
`;

type Props = React.HTMLAttributes<HTMLDivElement>;

const Loading = (props: Props) => {
    return (
        <Wrapper {...props} data-test="@dashboard/loading">
            <Spinner size={20} />
            <Title>
                <Translation id="TR_LOADING_WALLET" />
            </Title>
        </Wrapper>
    );
};

export default Loading;
