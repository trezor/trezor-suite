import React from 'react';
import styled from 'styled-components';
import { Button, colors, Tooltip } from '@trezor/components';
import { Translation } from '@suite-components';
// import { useDeviceActionLocks } from '@suite-utils/hooks';

interface Props {
    onClick?: () => void;
    disabled: boolean;
}

// > div:first-of-type is a workaround for tooltip (TODO)
const Wrapper = styled.div`
    display: flex;
    padding: 10px;
    position: sticky;
    z-index: 2;
    bottom: 0;
    background: ${colors.WHITE};
    box-shadow: 0 0 14px 0 rgba(0, 0, 0, 0.2);
    > div:first-of-type {
        display: block;
        flex: 1;
    }
`;

const StyledButton = styled(Button)`
    border: dashed 1px ${colors.BLACK50};
    background: ${colors.WHITE};
`;

const AddAccountButton = ({ onClick, disabled }: Props) => {
    // TODO: const [actionEnabled] = useDeviceActionLocks();
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

    if (disabled) {
        return (
            <Wrapper>
                <Tooltip
                    maxWidth={200}
                    content={<Translation id="TR_ADD_ACCOUNT" />}
                    placement="auto"
                >
                    {ButtonRow}
                </Tooltip>
            </Wrapper>
        );
    }
    return <Wrapper>{ButtonRow}</Wrapper>;
};

export default AddAccountButton;
