import React, { useCallback } from 'react';
import styled from 'styled-components';

import { desktopApi } from '@trezor/suite-desktop-api';
import { Button, H2, variables } from '@trezor/components';
import { Translation, Modal } from '@suite-components';
import { Row, LeftCol, RightCol, Divider } from './styles';

const Description = styled.span`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

interface Props {
    hideWindow: () => void;
}

const Ready = ({ hideWindow }: Props) => {
    const installRestart = useCallback(() => desktopApi.installUpdate(), []);

    return (
        <Modal
            heading={<Translation id="TR_UPDATE_MODAL_UPDATE_DOWNLOADED" />}
            cancelable
            onCancel={hideWindow}
        >
            <H2>
                <Translation id="TR_UPDATE_MODAL_INSTALL_NOW_OR_LATER" />
            </H2>
            <Description>
                <Translation id="TR_UPDATE_MODAL_RESTART_NEEDED" />
            </Description>

            {/* TODO: consider moving action buttons to Modal's bottomBar prop. Divider could be also rendered by Modal itself */}
            <Divider />

            <Row>
                <LeftCol>
                    <Button onClick={hideWindow} variant="secondary" fullWidth>
                        <Translation id="TR_UPDATE_MODAL_INSTALL_LATER" />
                    </Button>
                </LeftCol>
                <RightCol>
                    <Button onClick={installRestart} variant="primary" fullWidth>
                        <Translation id="TR_UPDATE_MODAL_INSTALL_AND_RESTART" />
                    </Button>
                </RightCol>
            </Row>
        </Modal>
    );
};

export default Ready;
