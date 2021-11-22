import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import { Button, P, Tooltip, variables } from '@trezor/components';
import { CheckItem, Translation, Modal, Image } from '@suite-components';
import { Divider } from './styles';

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

const Description = styled(P)`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

interface Props {
    hideWindow: () => void;
}

const EarlyAccessEnable = ({ hideWindow }: Props) => {
    const allowPrerelease = useCallback(
        (value?: boolean) => window.desktopApi?.allowPrerelease(value),
        [],
    );
    const [understood, setUnderstood] = useState(false);

    return (
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
                    <Button onClick={() => allowPrerelease(true)} isDisabled={!understood}>
                        <Translation id="TR_EARLY_ACCESS_ENABLE_CONFIRM" />
                    </Button>
                </Tooltip>
            </ButtonWrapper>
        </Modal>
    );
};

export default EarlyAccessEnable;
