import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';
import { Icon, Tooltip, colors } from '@trezor/components';
import messages from '@suite/support/messages';

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
`;

const RowAddAccountWrapper = styled.div<Props>`
    width: 100%;
    display: flex;
    align-items: center;
    color: ${colors.TEXT_SECONDARY};
    padding: 20px 25px;
    transition: color 0.3s;
    &:hover {
        cursor: ${props => (props.disabled ? 'default' : 'pointer')};
        color: ${props => (props.disabled ? colors.TEXT_SECONDARY : colors.TEXT_PRIMARY)};
    }
`;

const AddAccountIconWrapper = styled.div`
    margin-right: 12px;
    padding-top: 2px;
`;

const AddAccountButton = ({ onClick, tooltipContent, disabled }: Props) => {
    const ButtonRow = (
        <Wrapper onClick={onClick}>
            <RowAddAccountWrapper disabled={disabled}>
                <AddAccountIconWrapper>
                    <Icon icon="PLUS" size={14} color={colors.TEXT_SECONDARY} />
                </AddAccountIconWrapper>
                <Translation {...messages.TR_ADD_ACCOUNT} />
            </RowAddAccountWrapper>
        </Wrapper>
    );

    if (tooltipContent) {
        return (
            <Tooltip maxWidth={200} content={tooltipContent} placement="bottom">
                {ButtonRow}
            </Tooltip>
        );
    }
    return ButtonRow;
};

export default AddAccountButton;
