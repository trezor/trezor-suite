import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import { Button, H2, P, Tooltip, variables } from '@trezor/components';
import { CheckItem, Translation, Modal, Image } from '@suite-components';
import { LeftCol, RightCol, Divider } from './styles';

const BoxImageWrapper = styled.div`
    margin-left: auto;
    margin-right: auto;
    top: 50px;
    left: 0;
    right: 0;
`;

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
    enabled: boolean;
}

const EarlyAccess = ({ hideWindow, enabled }: Props) => {
    const allowPrerelease = useCallback(
        (value?: boolean) => window.desktopApi?.allowPrerelease(value),
        [],
    );
    const [understood, setUnderstood] = useState(false);

    return enabled ? (
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
                    <Button onClick={() => allowPrerelease(!enabled)} isDisabled={!understood}>
                        <Translation id="TR_EARLY_ACCESS_ENABLE_CONFIRM" />
                    </Button>
                </Tooltip>
            </ButtonWrapper>
        </Modal>
    );
};

export default EarlyAccess;
