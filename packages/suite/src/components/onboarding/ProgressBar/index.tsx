import React from 'react';

import { H1, TrezorLogo, Button, variables } from '@trezor/components';
import { TrezorLink, Translation } from '@suite-components';
import styled from 'styled-components';
import { SUPPORT_URL } from '@suite-constants/urls';

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    background: grey;
    margin: 60px 0px;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        display: none;
    }
`;

// interface Props {
//     activeStep: string;
// }

const ProgressBar = () => {
    return (
        <Wrapper>
            <div>step 1</div> <div>step 2</div>
        </Wrapper>
    );
};

export default ProgressBar;
