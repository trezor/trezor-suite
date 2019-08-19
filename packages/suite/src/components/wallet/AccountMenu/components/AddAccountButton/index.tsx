import * as React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';

import { Icon, Tooltip, colors, variables } from '@trezor/components';
import Row from '../../../Row';

import l10nMessages from '../../index.messages';

const RowAddAccountWrapper = styled.div<Omit<Props, 'onClick'>>`
    width: 100%;
    padding: ${variables.LEFT_NAVIGATION_ROW.PADDING};
    display: flex;
    align-items: center;
    color: ${colors.TEXT_SECONDARY};
    &:hover {
        cursor: ${props => (props.disabled ? 'default' : 'pointer')};
        color: ${props => (props.disabled ? colors.TEXT_SECONDARY : colors.TEXT_PRIMARY)};
    }
`;

const AddAccountIconWrapper = styled.div`
    margin-right: 12px;
`;

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    onClick?: (event: React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLElement>) => any;
    tooltipContent?: React.ReactChild;
    disabled?: boolean;
}

const AddAccountButton = ({ onClick, tooltipContent, disabled, ...rest }: Props) => {
    const ButtonRow = (
        <Row onClick={onClick} {...rest}>
            <RowAddAccountWrapper disabled={disabled}>
                <AddAccountIconWrapper>
                    <Icon icon="PLUS" size={14} color={colors.TEXT_SECONDARY} />
                </AddAccountIconWrapper>
                <FormattedMessage {...l10nMessages.TR_ADD_ACCOUNT} />
            </RowAddAccountWrapper>
        </Row>
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
