import React from 'react';
import styled from 'styled-components';
import { Link, H5, H6 } from '@trezor/components';

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
        <H6>APPLICATION VERSION</H6>
        <H5>{process.env.VERSION}</H5>
        <Line />
        <H6>LAST COMMIT HASH</H6>
        <Link
            variant="gray"
            href={`https://github.com/trezor/trezor-suite/commits/${process.env.COMMITHASH}`}
        >
            <H5>{process.env.COMMITHASH}</H5>
        </Link>
    </Wrapper>
);

export default Version;
