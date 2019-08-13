import React from 'react';
import styled from 'styled-components';

import * as BREAKPOINT from '@onboarding-config/breakpoints';

const Wrapper = styled.div`
    display: flex;
    justify-content: space-around;
    flex-direction: column;
    width: 100%;

    @media (min-width: ${BREAKPOINT.SM}px) {
        flex-direction: row;
    }
`;

const OptionsWrapper: React.FunctionComponent = props => {
    return <Wrapper>{props.children}</Wrapper>;
};

export default OptionsWrapper;
