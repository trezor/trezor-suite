import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import { desktopApi } from '@trezor/suite-desktop-api';
import { Button, P, Tooltip } from '@trezor/components';
import { CheckItem, Translation, Modal, Image } from '@suite-components';
import { useAnalytics } from '@suite-hooks';
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
    text-align: left;
`;

// Checkbox has 80% max-width by default but it's nicer full width here.
const Checkbox = styled(CheckItem)`
    max-width: 100%;
`;

interface Props {
    hideWindow: () => void;
}

const EarlyAccessEnable = ({ hideWindow }: Props) => {
    const analytics = useAnalytics();

    const [understood, setUnderstood] = useState(false);
    const [enabled, setEnabled] = useState(false);

    const allowPrerelease = useCallback(() => {
        analytics.report({
            type: 'settings/general/early-access',
            payload: {
                allowPrerelease: true,
            },
        });
        desktopApi.allowPrerelease(true);
        setEnabled(true);
    }, [analytics]);
    const checkForUpdates = useCallback(() => {
        analytics.report({
            type: 'settings/general/early-access/check-for-updates',
            payload: {
                checkNow: true,
            },
        });
        desktopApi.checkForUpdates(true);
    }, [analytics]);

    return enabled ? (
        <Modal>
            <ImageWrapper>
                <Image image="UNI_SUCCESS" />
            </ImageWrapper>
            <Title>
                <Translation id="TR_EARLY_ACCESS_JOINED_TITLE" />
            </Title>
            <Description>
                <Translation id="TR_EARLY_ACCESS_JOINED_DESCRIPTION" />
            </Description>

            <ButtonWrapper>
                <LeftCol>
                    <Button
                        onClick={() => {
                            analytics.report({
                                type: 'settings/general/early-access/check-for-updates',
                                payload: {
                                    checkNow: false,
                                },
                            });
                            hideWindow();
                        }}
                        variant="secondary"
                        fullWidth
                    >
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
            <Checkbox
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
