import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { Button, H1 } from '@trezor/components-v2';
import { InjectedModalApplicationProps } from '@suite-types';

const Wrapper = styled.div`
    width: 400px;
    height: 400px;
    display: flex;
    justify-content: center;
    flex-direction: column;
    padding: '100px';
`;

type Props = InjectedModalApplicationProps;

const Firmware = ({ closeModalApp, modal }: Props) => (
    <Wrapper>
        {modal && modal}
        {!modal && (
            <>
                <H1>Example app modal</H1>
                <Button onClick={() => closeModalApp()} data-test="@modal/firmware/exit-button">
                    Exit
                </Button>
            </>
        )}
    </Wrapper>
);

export default connect(null)(Firmware);
