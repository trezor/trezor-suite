import React, { useCallback } from 'react';
import styled from 'styled-components';

import { desktopApi } from '@trezor/suite-desktop-api';
import { Button, H2, variables } from '@trezor/components';
import { Translation, Modal } from '@suite-components';

const Description = styled.span`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const StyledModal = styled(Modal)`
    ${Modal.BottomBar} {
        > * {
            flex: 1;
        }
    }
`;

interface Props {
    hideWindow: () => void;
}

const Ready = ({ hideWindow }: Props) => {
    const installRestart = useCallback(() => desktopApi.installUpdate(), []);

    return (
        <StyledModal
            heading={<Translation id="TR_UPDATE_MODAL_UPDATE_DOWNLOADED" />}
            cancelable
            onCancel={hideWindow}
            bottomBar={
                <>
                    <Button onClick={hideWindow} variant="secondary">
                        <Translation id="TR_UPDATE_MODAL_INSTALL_LATER" />
                    </Button>
                    <Button onClick={installRestart} variant="primary">
                        <Translation id="TR_UPDATE_MODAL_INSTALL_AND_RESTART" />
                    </Button>
                </>
            }
        >
            <H2>
                <Translation id="TR_UPDATE_MODAL_INSTALL_NOW_OR_LATER" />
            </H2>
            <Description>
                <Translation id="TR_UPDATE_MODAL_RESTART_NEEDED" />
            </Description>
        </StyledModal>
    );
};

export default Ready;
