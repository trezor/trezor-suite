import React from 'react';
import styled from 'styled-components';
import { Link, H2, P } from '@trezor/components-v2';

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
    <Wrapper>
        <P size="small" weight="bold">
            APPLICATION VERSION
        </P>
        <H2>{process.env.VERSION}</H2>
        <Line />
        <P>LAST COMMIT HASH</P>
        <Link href={`https://github.com/trezor/trezor-suite/commits/${process.env.COMMITHASH}`}>
            <H2>{process.env.COMMITHASH}</H2>
        </Link>
    </Wrapper>
);

export default Version;
