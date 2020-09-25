import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    justify-content: center;
    flex-direction: column;
    margin-top: 24px;

    @media (min-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: row;
    }
`;

const OptionsWrapper: React.FunctionComponent = props => {
    return <Wrapper>{props.children}</Wrapper>;
};

export default OptionsWrapper;
