import { Translation, Image } from '@suite-components';
import { Button, H2, P } from '@trezor/components';
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
    max-width: 600px;
    padding: 40px;
`;

const ImageWrapper = styled.div`
    padding: 60px 0px;
`;

const Actions = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
`;

interface Props {
    onReceiveConfirmation: (confirmed: boolean) => void;
    onCreateBackup: () => void;
}

const ConfirmNoBackup = ({ onReceiveConfirmation, onCreateBackup }: Props) => (
    <Wrapper>
        <H2>
            <Translation id="TR_YOUR_TREZOR_IS_NOT_BACKED_UP" />
        </H2>
        <P size="small">
            <Translation id="TR_IF_YOUR_DEVICE_IS_EVER_LOST" />
        </P>
        <ImageWrapper>
            <Image image="UNI_ERROR" />
        </ImageWrapper>
        <Actions>
            <Button
                variant="secondary"
                onClick={() => onReceiveConfirmation(true)}
                data-test="@no-backup/take-risk-button"
            >
                <Translation id="TR_SHOW_ADDRESS_ANYWAY" />
            </Button>
            <Button
                onClick={() => {
                    onReceiveConfirmation(false);
                    onCreateBackup();
                }}
            >
                <Translation id="TR_CREATE_BACKUP" />
            </Button>
        </Actions>
    </Wrapper>
);

export default ConfirmNoBackup;
