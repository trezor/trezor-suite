import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import { Button, P, Tooltip } from '@trezor/components';
import { CheckItem, Translation, Modal, Image } from '@suite-components';
import {
    ImageWrapper,
    ButtonWrapper,
    Description,
    Divider,
    LeftCol,
    RightCol,
    Title,
} from './styles';

const DescriptionWrapper = styled.div`
    display: flex;
`;

const DescriptionTextWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: space-around;
    margin-left: 20px;
`;

interface Props {
    hideWindow: () => void;
}

const EarlyAccessEnable = ({ hideWindow }: Props) => {
    const [understood, setUnderstood] = useState(false);
    const [enabled, setEnabled] = useState(false);

    const allowPrerelease = useCallback(() => {
        window.desktopApi?.allowPrerelease(true);
        setEnabled(true);
    }, []);
    const checkForUpdates = useCallback(() => window.desktopApi?.checkForUpdates(true), []);

    return enabled ? (
        <Modal>
            <ImageWrapper>
                <Image width={160} height={160} image="UNI_SUCCESS" />
            </ImageWrapper>
            <Title>
                <Translation id="TR_EARLY_ACCESS_JOINED_TITLE" />
            </Title>
            <Description>
                <Translation id="TR_EARLY_ACCESS_JOINED_DESCRIPTION" />
            </Description>

            <ButtonWrapper>
                <LeftCol>
                    <Button onClick={hideWindow} variant="secondary" fullWidth>
                        <Translation id="TR_EARLY_ACCESS_SKIP_CHECK" />
                    </Button>
                </LeftCol>
                <RightCol>
                    <Button onClick={checkForUpdates} fullWidth>
                        <Translation id="TR_EARLY_ACCESS_CHECK_UPDATE" />
                    </Button>
                </RightCol>
            </ButtonWrapper>
        </Modal>
    ) : (
        <Modal heading={<Translation id="TR_EARLY_ACCESS" />} cancelable onCancel={hideWindow}>
            <DescriptionWrapper>
                <Image width={60} height={60} image="EARLY_ACCESS" />
                <DescriptionTextWrapper>
                    <P weight="bold">
                        <Translation id="TR_EARLY_ACCESS_ENABLE_CONFIRM_TITLE" />
                    </P>
                    <Description>
                        <Translation id="TR_EARLY_ACCESS_ENABLE_CONFIRM_DESCRIPTION" />
                    </Description>
                </DescriptionTextWrapper>
            </DescriptionWrapper>
            <Divider />
            <CheckItem
                data-test="@settings/early-access-confirm-check"
                title={
                    <P weight="bold">
                        <Translation id="TR_EARLY_ACCESS_ENABLE_CONFIRM_CHECK" />
                    </P>
                }
                description=""
                isChecked={understood}
                onClick={() => setUnderstood(!understood)}
            />

            <ButtonWrapper>
                <Tooltip
                    maxWidth={285}
                    content={
                        !understood && <Translation id="TR_EARLY_ACCESS_ENABLE_CONFIRM_TOOLTIP" />
                    }
                >
                    <Button onClick={allowPrerelease} isDisabled={!understood}>
                        <Translation id="TR_EARLY_ACCESS_ENABLE_CONFIRM" />
                    </Button>
                </Tooltip>
            </ButtonWrapper>
        </Modal>
    );
};

export default EarlyAccessEnable;
