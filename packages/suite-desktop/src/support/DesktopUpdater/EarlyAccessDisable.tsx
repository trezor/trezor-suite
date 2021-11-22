import React, { useCallback } from 'react';
import styled from 'styled-components';

import { Button, H2, P, variables } from '@trezor/components';
import { Translation, Modal, Image } from '@suite-components';
import { LeftCol, RightCol } from './styles';

const BoxImageWrapper = styled.div`
    margin-left: auto;
    margin-right: auto;
    top: 50px;
    left: 0;
    right: 0;
`;

const ButtonWrapper = styled.div`
    display: flex;
    justify-content: center;
    padding-top: 24px;
`;

const Title = styled(H2)`
    padding-top: 24px;
    padding-bottom: 12px;
`;

const Description = styled(P)`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

interface Props {
    hideWindow: () => void;
}

const EarlyAccessDisable = ({ hideWindow }: Props) => {
    const allowPrerelease = useCallback(
        (value?: boolean) => window.desktopApi?.allowPrerelease(value),
        [],
    );

    return (
        <Modal>
            <BoxImageWrapper>
                <Image width={60} height={60} image="EARLY_ACCESS_DISABLE" />
            </BoxImageWrapper>
            <Title>
                <Translation id="TR_EARLY_ACCESS_DISABLE_CONFIRM_TITLE" />
            </Title>
            <Description>
                <Translation id="TR_EARLY_ACCESS_DISABLE_CONFIRM_DESCRIPTION" />
            </Description>

            <ButtonWrapper>
                <LeftCol>
                    <Button onClick={hideWindow} variant="secondary" fullWidth>
                        <Translation id="TR_CANCEL" />
                    </Button>
                </LeftCol>
                <RightCol>
                    <Button onClick={() => allowPrerelease(false)} fullWidth>
                        <Translation id="TR_EARLY_ACCESS_DISABLE" />
                    </Button>
                </RightCol>
            </ButtonWrapper>
        </Modal>
    );
};

export default EarlyAccessDisable;
