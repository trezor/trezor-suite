import React, { useCallback, useState } from 'react';

import { desktopApi } from '@trezor/suite-desktop-api';
import { Button } from '@trezor/components';
import { Translation, Modal, Image, TrezorLink } from '@suite-components';
import { useAnalytics } from '@suite-hooks';
import styled from 'styled-components';
import { ImageWrapper, Description, Title } from './styles';
import { SUITE_URL } from '@suite-constants/urls';

export const Link = styled(TrezorLink)`
    width: 100%;
`;
interface Props {
    hideWindow: () => void;
}

const EarlyAccessDisable = ({ hideWindow }: Props) => {
    const analytics = useAnalytics();

    const [enabled, setEnabled] = useState(true);

    const allowPrerelease = useCallback(() => {
        analytics.report({
            type: 'settings/general/early-access',
            payload: {
                allowPrerelease: false,
            },
        });
        desktopApi.allowPrerelease(false);
        setEnabled(false);
    }, [analytics]);

    return enabled ? (
        <Modal
            bottomBar={
                <>
                    <Button onClick={hideWindow} variant="secondary" fullWidth>
                        <Translation id="TR_EARLY_ACCESS_STAY_IN" />
                    </Button>
                    <Button onClick={allowPrerelease} fullWidth>
                        <Translation id="TR_EARLY_ACCESS_DISABLE" />
                    </Button>
                </>
            }
        >
            <ImageWrapper>
                <Image width={60} height={60} image="EARLY_ACCESS_DISABLE" />
            </ImageWrapper>
            <Title>
                <Translation id="TR_EARLY_ACCESS_DISABLE_CONFIRM_TITLE" />
            </Title>
            <Description>
                <Translation id="TR_EARLY_ACCESS_DISABLE_CONFIRM_DESCRIPTION" />
            </Description>
        </Modal>
    ) : (
        <Modal
            bottomBar={
                <>
                    <Button onClick={hideWindow} variant="secondary" fullWidth>
                        <Translation id="TR_EARLY_ACCESS_SKIP_REINSTALL" />
                    </Button>
                    <Link
                        variant="nostyle"
                        href={SUITE_URL}
                        onClick={() => {
                            analytics.report({
                                type: 'settings/general/early-access/download-stable',
                            });
                        }}
                    >
                        <Button icon="EXTERNAL_LINK" alignIcon="right" fullWidth>
                            <Translation id="TR_EARLY_ACCESS_REINSTALL" />
                        </Button>
                    </Link>
                </>
            }
        >
            <ImageWrapper>
                <Image image="UNI_SUCCESS" />
            </ImageWrapper>
            <Title>
                <Translation id="TR_EARLY_ACCESS_LEFT_TITLE" />
            </Title>
            <Description>
                <Translation id="TR_EARLY_ACCESS_LEFT_DESCRIPTION" />
            </Description>
        </Modal>
    );
};

export default EarlyAccessDisable;
