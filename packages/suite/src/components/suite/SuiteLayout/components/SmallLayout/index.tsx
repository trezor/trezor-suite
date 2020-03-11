import React from 'react';
import styled from 'styled-components';
import { H2, P, Button } from '@trezor/components';
import { resolveStaticPath } from '@suite-utils/nextjs';

const Wrapper = styled.div`
    display: flex;
    padding: 0 20px;
    flex-direction: column;
`;

const StyledP = styled(P)`
    text-align: center;
`;

const StyledH2 = styled(H2)`
    text-align: center;
`;

const Image = styled.img``;

export default () => {
    return (
        <Wrapper>
            <Image src={resolveStaticPath('images/suite/screen-too-small.svg')} />
            <StyledH2>Your display resolution is too small :(</StyledH2>
            <StyledP>
                In order to keep our users safe, we decided to not support very small resolution
                displays.
            </StyledP>
            <StyledP>Please open Trezor Suite on larger display or in desktop browser.</StyledP>
            <Button variant="tertiary">Request desktop version</Button>
        </Wrapper>
    );
};
