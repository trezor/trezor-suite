import React from 'react';
import styled from 'styled-components';
import { Button, colors, Tooltip } from '@trezor/components';
import { Translation } from '@suite-components';
import { TrezorDevice } from '@suite-types';

interface Props {
    onClick?: () => void;
    disabled: boolean;
    isOverlaying?: boolean;
    device?: TrezorDevice;
}

const Wrapper = styled.div<{ isOverlaying?: boolean }>`
    display: flex;
    padding: 10px;
    position: sticky;
    z-index: 2;
    bottom: 0;
    background: ${colors.WHITE};
    box-shadow: ${props => (props.isOverlaying ? '0 0 14px 0 rgba(0, 0, 0, 0.2)' : 'none')};
`;

// workaround to expand tooltip (and child button) to full width
const StyledTooltip = styled(Tooltip)`
    width: 100%;
    > span:first-of-type {
        width: 100%;
    }
`;

const StyledButton = styled(Button)`
    border: dashed 1px ${colors.BLACK50};
    background: ${colors.WHITE};
`;

const AddAccountButton = ({ onClick, disabled, device, isOverlaying }: Props) => {
    const clickHandler = !disabled ? onClick : undefined;
    const tooltipMessage =
        device && !device.connected ? (
            <Translation id="TR_TO_ADD_NEW_ACCOUNT_PLEASE_CONNECT" />
        ) : undefined;

    const ButtonRow = (
        <StyledButton
            onClick={clickHandler}
            icon="PLUS"
            variant="secondary"
            fullWidth
            isDisabled={disabled}
        >
            <Translation id="TR_ADD_ACCOUNT" />
        </StyledButton>
    );

    if (tooltipMessage) {
        return (
            <Wrapper isOverlaying={isOverlaying}>
                <StyledTooltip maxWidth={200} content={tooltipMessage} placement="top">
                    {ButtonRow}
                </StyledTooltip>
            </Wrapper>
        );
    }
    return <Wrapper isOverlaying={isOverlaying}>{ButtonRow}</Wrapper>;
};

export default AddAccountButton;
