import React from 'react';
import styled from 'styled-components';
import { H2, Button } from '@trezor/components';
import { Loading, Translation, Image, Modal, ModalProps } from '@suite-components';
import * as recoveryActions from '@recovery-actions/recoveryActions';
import { useDevice, useSelector, useActions } from '@suite-hooks';

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

interface Props {
    modalProps?: ModalProps;
}

const Index = ({ modalProps }: Props) => {
    const recovery = useSelector(state => state.recovery);
    const { rerun } = useActions({ rerun: recoveryActions.rerun });

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
