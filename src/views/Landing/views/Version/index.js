import React from 'react';
import styled from 'styled-components';
import { H3, H2 } from 'components/Heading';
import LandingWrapper from 'views/Landing/components/LandingWrapper';
import Link from 'components/Link';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

const Line = styled.div`
    padding: 20px;
`;

const Version = () => (
    <LandingWrapper>
        <Wrapper>
            <H3>APPLICATION VERSION</H3>
            <H2>{VERSION}</H2>
            <Line />
            <H3>LAST COMMIT HASH</H3>
            <Link href={`https://github.com/trezor/trezor-wallet/commits/${COMMITHASH}`}>
                <H2>{COMMITHASH}</H2>
            </Link>
        </Wrapper>
    </LandingWrapper>
);

export default Version;