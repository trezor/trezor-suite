import React from 'react';
import styled from 'styled-components';
import { Icon, colors, Tooltip } from '@trezor/components';
//

interface Props {
    onClick?: () => any;
    tooltipContent?: React.ReactChild;
    disabled?: boolean;
}

const Wrapper = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
`;

// const RowAddAccountWrapper = styled.div<Props>`
//     width: 100%;
//     display: flex;
//     align-items: center;
//     color: ${colors.TEXT_SECONDARY};
//     padding: 20px 25px;
//     transition: color 0.3s;
//     &:hover {
//         cursor: ${props => (props.disabled ? 'default' : 'pointer')};
//         color: ${props => (props.disabled ? colors.TEXT_SECONDARY : colors.TEXT_PRIMARY)};
//     }
// `;

const AddAccountButton = ({ onClick, tooltipContent, disabled }: Props) => {
    const clickHandler = !disabled ? onClick : undefined;
    const ButtonRow = (
        <Wrapper onClick={clickHandler}>
            {/* <RowAddAccountWrapper disabled={disabled}> */}
            <Icon icon="PLUS" size={16} color={disabled ? colors.BLACK92 : colors.BLACK17} />
            {/* <Translation id="TR_ADD_ACCOUNT" /> */}
            {/* </RowAddAccountWrapper> */}
        </Wrapper>
    );

    if (tooltipContent && !disabled) {
        return (
            <Tooltip maxWidth={200} content={tooltipContent} placement="bottom">
                {ButtonRow}
            </Tooltip>
        );
    }
    return ButtonRow;
};

export default AddAccountButton;
