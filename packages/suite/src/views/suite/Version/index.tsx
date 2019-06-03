import React from 'react';
import styled from 'styled-components';
import { Link, H5, H6 } from '@trezor/components';
import LandingWrapper from '../Landing/components/LandingWrapper';

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
            <H6>APPLICATION VERSION</H6>
            <H5>{VERSION}</H5>
            <Line />
            <H6>LAST COMMIT HASH</H6>
            <Link isGray href={`https://github.com/trezor/trezor-wallet/commits/${COMMITHASH}`}>
                <H5>{COMMITHASH}</H5>
            </Link>
        </Wrapper>
    </LandingWrapper>
);

export default Version;
