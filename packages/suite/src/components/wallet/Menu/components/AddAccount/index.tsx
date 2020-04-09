import React from 'react';
import styled from 'styled-components';
import { Button, colors, Tooltip } from '@trezor/components';
import { Translation } from '@suite-components';

interface Props {
    onClick?: () => void;
    disabled: boolean;
}

const Wrapper = styled.div`
    display: flex;
    padding: 10px;
    position: sticky;
    z-index: 2;
    bottom: 0;
    background: ${colors.WHITE};
    box-shadow: 0 0 14px 0 rgba(0, 0, 0, 0.2);
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

const AddAccountButton = ({ onClick, disabled }: Props) => {
    const clickHandler = !disabled ? onClick : undefined;
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

    if (!disabled) {
        return (
            <Wrapper>
                <StyledTooltip
                    maxWidth={200}
                    content={<Translation id="TR_ADD_ACCOUNT_DISABLED_EXPLAIN" />}
                    placement="top"
                >
                    {ButtonRow}
                </StyledTooltip>
            </Wrapper>
        );
    }
    return <Wrapper>{ButtonRow}</Wrapper>;
};

export default AddAccountButton;
