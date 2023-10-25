import { useCallback, useState } from 'react';

import styled from 'styled-components';

import { analytics, EventType } from '@trezor/suite-analytics';
import { desktopApi } from '@trezor/suite-desktop-api';
import { Button, Paragraph, Tooltip, Image } from '@trezor/components';

import { CheckItem, Translation, Modal } from 'src/components/suite';

import { ImageWrapper, Description, Divider, Title } from './styles';

const DescriptionWrapper = styled.div`
    display: flex;
`;

const DescriptionTextWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: space-around;
    margin-left: 20px;
    text-align: left;
`;

// Checkbox has 80% max-width by default but it's nicer full width here.
const Checkbox = styled(CheckItem)`
    max-width: 100%;
`;

const StyledModal = styled(Modal)`
    ${Modal.BottomBar} {
        > * {
            flex: 1;
        }
    }
`;

interface EarlyAccessEnableProps {
    hideWindow: () => void;
}

export const EarlyAccessEnable = ({ hideWindow }: EarlyAccessEnableProps) => {
    const [understood, setUnderstood] = useState(false);
    const [enabled, setEnabled] = useState(false);

    const allowPrerelease = useCallback(() => {
        analytics.report({
            type: EventType.SettingsGeneralEarlyAccess,
            payload: {
                allowPrerelease: true,
            },
        });
        desktopApi.allowPrerelease(true);
        setEnabled(true);
    }, []);

    const checkForUpdates = useCallback(() => desktopApi.checkForUpdates(true), []);

    return enabled ? (
        <StyledModal
            bottomBarComponents={
                <>
                    <Button onClick={hideWindow} variant="secondary">
                        <Translation id="TR_EARLY_ACCESS_SKIP_CHECK" />
                    </Button>
                    <Button onClick={checkForUpdates}>
                        <Translation id="TR_EARLY_ACCESS_CHECK_UPDATE" />
                    </Button>
                </>
            }
        >
            <ImageWrapper>
                <Image image="UNI_SUCCESS" />
            </ImageWrapper>
            <Title>
                <Translation id="TR_EARLY_ACCESS_JOINED_TITLE" />
            </Title>
            <Description>
                <Translation id="TR_EARLY_ACCESS_JOINED_DESCRIPTION" />
            </Description>
        </StyledModal>
    ) : (
        <Modal
            heading={<Translation id="TR_EARLY_ACCESS" />}
            isCancelable
            onCancel={hideWindow}
            bottomBarComponents={
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
            }
        >
            <DescriptionWrapper>
                <Image width={60} height={60} image="EARLY_ACCESS" />
                <DescriptionTextWrapper>
                    <Paragraph type="highlight">
                        <Translation id="TR_EARLY_ACCESS_ENABLE_CONFIRM_TITLE" />
                    </Paragraph>
                    <Description>
                        <Translation id="TR_EARLY_ACCESS_ENABLE_CONFIRM_DESCRIPTION" />
                    </Description>
                </DescriptionTextWrapper>
            </DescriptionWrapper>
            <Divider />
            <Checkbox
                data-test="@settings/early-access-confirm-check"
                title={
                    <Paragraph type="highlight">
                        <Translation id="TR_EARLY_ACCESS_ENABLE_CONFIRM_CHECK" />
                    </Paragraph>
                }
                description=""
                isChecked={understood}
                onClick={() => setUnderstood(!understood)}
            />
        </Modal>
    );
};
