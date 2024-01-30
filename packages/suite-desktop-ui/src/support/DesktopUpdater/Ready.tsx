import styled from 'styled-components';

import { Button, H2, variables } from '@trezor/components';

import { Translation, Modal } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { installUpdate } from 'src/actions/suite/desktopUpdateActions';

const Description = styled.span`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
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
    const dispatch = useDispatch();

    const install = () => dispatch(installUpdate());
    const installOnQuit = () => {
        dispatch(installUpdate(true));
        hideWindow();
    };

    return (
        <StyledModal
            heading={<Translation id="TR_UPDATE_MODAL_UPDATE_DOWNLOADED" />}
            isCancelable={isCancelable}
            onCancel={installOnQuit}
            bottomBarComponents={
                <>
                    <Button onClick={installOnQuit} variant="tertiary">
                        <Translation id="TR_UPDATE_MODAL_UPDATE_ON_QUIT" />
                    </Button>
                    <Button onClick={install} variant="primary">
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
