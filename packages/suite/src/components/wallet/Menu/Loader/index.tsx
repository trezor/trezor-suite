import React from 'react';
import styled from 'styled-components';
import { colors } from '@trezor/components';

interface Props {
    progress: number;
}

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    max-width: 1170px;
    flex-direction: row;
    flex: 1 1 0%;
`;

const Line = styled.div<Props>`
    height: 2px;
    display: flex;
    background: ${colors.GREEN_PRIMARY};
    width: ${props => props.progress}%;
`;

const Loader = (props: Props) => {
    return (
        <Wrapper>
            <Line progress={props.progress} />
        </Wrapper>
    );
};

export default Loader;
