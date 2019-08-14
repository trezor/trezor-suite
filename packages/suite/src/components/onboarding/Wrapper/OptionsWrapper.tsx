import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    justify-content: space-around;
    flex-direction: column;
    width: 100%;

    @media (min-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: row;
    }
`;

const OptionsWrapper: React.FunctionComponent = props => {
    return <Wrapper>{props.children}</Wrapper>;
};

export default OptionsWrapper;
