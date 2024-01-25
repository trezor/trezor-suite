import { useCallback, useState } from 'react';

import styled from 'styled-components';

import { SUITE_URL } from '@trezor/urls';
import { analytics, EventType } from '@trezor/suite-analytics';
import { desktopApi } from '@trezor/suite-desktop-api';
import { Button, Image } from '@trezor/components';

import { Translation, Modal, TrezorLink } from 'src/components/suite';
import { DialogModal } from 'src/components/suite/modals/Modal/DialogRenderer';

import { ImageWrapper, Description, Title } from './styles';

export const Link = styled(TrezorLink)`
    width: 100%;
`;

const StyledModal = styled(Modal)`
    ${Modal.BottomBar} {
        > * {
            flex: 1;
        }
    }
`;

const LinkButton = styled(Button)`
    width: 100%;
`;

interface EarlyAccessDisableProps {
    hideWindow: () => void;
}

export const EarlyAccessDisable = ({ hideWindow }: EarlyAccessDisableProps) => {
    const [enabled, setEnabled] = useState(true);

    const allowPrerelease = useCallback(() => {
        analytics.report({
            type: EventType.SettingsGeneralEarlyAccess,
            payload: {
                allowPrerelease: false,
            },
        });
        desktopApi.allowPrerelease(false);
        setEnabled(false);
    }, []);

    return enabled ? (
        <StyledModal
            bottomBarComponents={
                <>
                    <Button onClick={allowPrerelease}>
                        <Translation id="TR_EARLY_ACCESS_DISABLE" />
                    </Button>
                    <Button onClick={hideWindow} variant="tertiary">
                        <Translation id="TR_EARLY_ACCESS_STAY_IN" />
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
        </StyledModal>
    ) : (
        <DialogModal
            icon="check"
            bodyHeading={<Translation id="TR_EARLY_ACCESS_LEFT_TITLE" />}
            text={<Translation id="TR_EARLY_ACCESS_LEFT_DESCRIPTION" />}
            bottomBarComponents={
                <>
                    <Link variant="nostyle" href={SUITE_URL}>
                        <LinkButton icon="EXTERNAL_LINK" iconAlignment="right">
                            <Translation id="TR_EARLY_ACCESS_REINSTALL" />
                        </LinkButton>
                    </Link>
                    <Button onClick={hideWindow} variant="tertiary">
                        <Translation id="TR_EARLY_ACCESS_SKIP_REINSTALL" />
                    </Button>
                </>
            }
        />
    );
};
