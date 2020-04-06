import React from 'react';
import styled from 'styled-components';
import { H2, Button } from '@trezor/components';
import { Loading, Translation, Image } from '@suite-components';

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

const StyledImage = styled(Image)`
    flex: 1;
`;

const Index = ({ recovery, device, checkSeed, recoverDevice, goToStep, addPath }: Props) => { 
    const image = device?.features?.major_version === 2 ? 'FIRMWARE_INIT_2' : 'FIRMWARE_INIT_1';

    <Wrapper>
        {recovery.status === 'in-progress' && <Loading />}
        {recovery.status !== 'in-progress' && (
            <>
                <H2>
                    <Translation id="TR_DEVICE_IN_RECOVERY_MODE" />
                </H2>
                <StyledImage image={image} />
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
    )
};

export default Index;
