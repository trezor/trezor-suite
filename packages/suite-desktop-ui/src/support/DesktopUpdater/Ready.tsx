import React from 'react';

import styled from 'styled-components';
import { Translation, Modal } from 'src/components/suite';
import { useActions } from 'src/hooks/suite';
import * as desktopUpdateActions from 'src/actions/suite/desktopUpdateActions';

import { Button, H2, variables } from '@trezor/components';

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

interface ReadyProps {
    hideWindow: () => void;
    isCancelable: boolean;
}

export const Ready = ({ hideWindow, isCancelable }: ReadyProps) => {
    const { installUpdate } = useActions({
        installUpdate: desktopUpdateActions.installUpdate,
    });

    const installOnQuit = () => {
        installUpdate(true);
        hideWindow();
    };

    return (
        <StyledModal
            heading={<Translation id="TR_UPDATE_MODAL_UPDATE_DOWNLOADED" />}
            isCancelable={isCancelable}
            onCancel={installOnQuit}
            bottomBar={
                <>
                    <Button onClick={installOnQuit} variant="secondary">
                        <Translation id="TR_UPDATE_MODAL_UPDATE_ON_QUIT" />
                    </Button>
                    <Button onClick={() => installUpdate()} variant="primary">
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
