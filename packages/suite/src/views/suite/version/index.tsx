import React from 'react';
import styled from 'styled-components';
import { Link, H2, P } from '@trezor/components';
import { Modal } from '@suite-components';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const Line = styled.div`
    padding: 20px;
`;

const Version = () => (
    <Modal>
        <Wrapper>
            <P size="small" weight="bold">
                APPLICATION VERSION
            </P>
            <H2>{process.env.VERSION}</H2>
            <Line />
            <P size="small" weight="bold">
                LAST COMMIT HASH
            </P>
            <Link href={`https://github.com/trezor/trezor-suite/commits/${process.env.COMMITHASH}`}>
                <H2>{process.env.COMMITHASH}</H2>
            </Link>
        </Wrapper>
    </Modal>
);

export default Version;
