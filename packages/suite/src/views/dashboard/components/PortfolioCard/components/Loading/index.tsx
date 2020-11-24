import React from 'react';
import styled from 'styled-components';
import { variables, Loader } from '@trezor/components';
import { Translation } from '@suite-components';
import { useSelector } from '@suite-hooks';

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
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    margin-left: 12px;
`;

type Props = React.HTMLAttributes<HTMLDivElement>;

const Loading = (props: Props) => {
    const waitingForDevice = !useSelector(state => state.suite.device)?.state;

    return (
        <Wrapper {...props} data-test="@dashboard/loading">
            {!waitingForDevice && <Loader size={20} />}
            <Title>
                <Translation id="TR_LOADING_WALLET" />
            </Title>
        </Wrapper>
    );
};

export default Loading;
