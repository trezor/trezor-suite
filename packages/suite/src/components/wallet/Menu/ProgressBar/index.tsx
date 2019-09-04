import React from 'react';
import styled from 'styled-components';
import { colors } from '@trezor/components';

interface Props {
    progress: number;
}

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: row;
`;

const Line = styled.div<Props>`
    height: 1px;
    display: flex;
    background: ${props => (props.progress !== 100 ? colors.GREEN_PRIMARY : colors.GRAY_LIGHT)};
    width: ${props => props.progress}%;
`;

const ProgressBar = (props: Props) => {
    return (
        <Wrapper>
            <Line progress={props.progress} />
        </Wrapper>
    );
};

export default ProgressBar;
