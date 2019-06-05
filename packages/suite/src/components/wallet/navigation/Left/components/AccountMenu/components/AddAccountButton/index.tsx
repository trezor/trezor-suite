/* @flow */
import * as React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { Icon, Tooltip, variables, colors } from '@trezor/components';
import Row from '../../../Row';

import l10nMessages from '../../index.messages';

const RowAddAccountWrapper = styled.div`
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

type Props = {
    onClick?: () => any,
    tooltipContent?: React.Node,
    disabled?: boolean,
};

const AddAccountButton = ({ onClick, tooltipContent, disabled }: Props) => {
    const ButtonRow = (
        <Row onClick={onClick}>
            <RowAddAccountWrapper disabled={disabled}>
                <AddAccountIconWrapper>
                    <Icon icon={ICONS.PLUS} size={14} color={colors.TEXT_SECONDARY} />
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

AddAccountButton.propTypes = {
    onClick: PropTypes.func,
    className: PropTypes.string,
    tooltipContent: PropTypes.node,
    disabled: PropTypes.bool,
};
