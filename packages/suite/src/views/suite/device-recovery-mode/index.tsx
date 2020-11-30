import React from 'react';
import styled from 'styled-components';
import { H2, Button } from '@trezor/components';
import { Loading, Translation, Image, Modal, ModalProps } from '@suite-components';
import { useDevice } from '@suite-hooks';

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

const Index = ({ recovery, rerun, modalProps }: Props & { modalProps?: ModalProps }) => {
    const { isLocked } = useDevice();
    return (
        <Modal {...modalProps}>
            <Wrapper data-test="@device-invalid-mode/recovery">
                {recovery.status === 'in-progress' && <Loading noBackground />}
                {/*
                    The section below shall actually never render. RecoveryDevice call should be triggered
                    immediately after suite finds that user has connected device in recovery mode
                */}
                {recovery.status !== 'in-progress' && (
                    <>
                        <H2>
                            <Translation id="TR_DEVICE_IN_RECOVERY_MODE" />
                        </H2>
                        <StyledImage image="FIRMWARE_INIT_2" />
                        {!isLocked && (
                            <Buttons>
                                <Button onClick={rerun}>
                                    <Translation id="TR_CONTINUE" />
                                </Button>
                            </Buttons>
                        )}
                    </>
                )}
            </Wrapper>
        </Modal>
    );
};

export default Index;
