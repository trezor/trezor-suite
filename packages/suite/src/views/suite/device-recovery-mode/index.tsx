import React from 'react';
import styled from 'styled-components';
import { H2, Button } from '@trezor/components';
import { Loading, Translation } from '@suite-components';

import { Props } from './Container';

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    flex-direction: column;
`;

const Buttons = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    margin: 20px;
`;

const Index = ({ recovery, device, checkSeed, recoverDevice, goToStep, addPath }: Props) => (
    <Wrapper>
        {recovery.status === 'in-progress' && <Loading />}
        {recovery.status === 'initial' && (
            <>
                <H2>
                    <Translation id="TR_DEVICE_IN_RECOVERY_MODE" />
                </H2>
                <Buttons>
                    {!device?.features?.initialized && (
                        <Button
                            onClick={() => {
                                recoverDevice();
                                goToStep('recovery');
                                addPath('recovery');
                            }}
                        >
                            <Translation id="TR_CONTINUE" />
                        </Button>
                    )}
                    {device?.features?.initialized && (
                        <Button onClick={() => checkSeed()}>
                            <Translation id="TR_CONTINUE" />
                        </Button>
                    )}
                </Buttons>
            </>
        )}
    </Wrapper>
);

export default Index;
