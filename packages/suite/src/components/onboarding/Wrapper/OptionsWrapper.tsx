import React from 'react';
import styled from 'styled-components';

import * as BREAKPOINT from '@onboarding-config/breakpoints';

const Wrapper = styled.div<{ count: number }>`
    display: flex;
    justify-content: space-around;
    flex-direction: column;
    width: 100%;

    @media (min-width: ${BREAKPOINT.SM}px) {
        width: ${props => props.count * 215};
        flex-direction: row;
    }
`;

const OptionsWrapper: React.FunctionComponent = (props) => {
    return <Wrapper count={props.children.length}>{props.children}</Wrapper>;
};

export default OptionsWrapper;
