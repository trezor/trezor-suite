/* @flow */

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import colors from 'config/colors';
import { LINE_HEIGHT, FONT_SIZE, FONT_WEIGHT } from 'config/variables';

import P from 'components/Paragraph';
import DeviceIcon from 'components/images/DeviceIcon';
import { H3 } from 'components/Heading';
import { FormattedMessage } from 'react-intl';

import type { TrezorDevice, State } from 'flowtype';
import l10nMessages from './index.messages';


type Props = {
    device: TrezorDevice;
    sendForm: $ElementType<State, 'sendFormEthereum'> | $ElementType<State, 'sendFormRipple'>;
}

const Wrapper = styled.div`
    max-width: 390px;
`;

const Header = styled.div`
    padding: 30px 48px;
`;

const Content = styled.div`
    border-top: 1px solid ${colors.DIVIDER};
    background: ${colors.MAIN};
    padding: 30px 48px;
    border-radius: 4px;
`;

const StyledP = styled(P)`
    padding-bottom: 20px;
    color: ${colors.TEXT};
    font-size: ${FONT_SIZE.BASE};
    &:last-child {
        padding-bottom: 0px;
    }
`;

const Address = styled(StyledP)`
    word-wrap: break-word;
    line-height: ${LINE_HEIGHT.SMALL};
`;

const Label = styled.div`
    padding-bottom: 6px;
    font-weight: ${FONT_WEIGHT.MEDIUM};
    font-size: ${FONT_SIZE.SMALL};
    color: ${colors.TEXT_SECONDARY};
`;

const FeeLevelName = styled(StyledP)`
    padding-bottom: 0px;
`;

const ConfirmSignTx = (props: Props) => {
    const {
        amount,
        address,
        selectedFeeLevel,
    } = props.sendForm;

    const currency: string = typeof props.sendForm.currency === 'string' ? props.sendForm.currency : props.sendForm.networkSymbol;

    return (
        <Wrapper>
            <Header>
                <DeviceIcon device={props.device} size={60} color={colors.TEXT_SECONDARY} />
                <H3>
                    <FormattedMessage {...l10nMessages.TR_CONFIRM_TRANSACTION_ON} values={{ deviceLabel: props.device.label }} />
                </H3>
                <P isSmaller>
                    <FormattedMessage {...l10nMessages.TR_DETAILS_ARE_SHOWN_ON} />
                </P>
            </Header>
            <Content>
                <Label>
                    <FormattedMessage {...l10nMessages.TR_SEND_LABEL} />
                </Label>
                <StyledP>{`${amount} ${currency}` }</StyledP>
                <Label>
                    <FormattedMessage {...l10nMessages.TR_TO_LABEL} />
                </Label>
                <Address>{ address }</Address>
                <Label>
                    <FormattedMessage {...l10nMessages.TR_FEE_LABEL} />
                </Label>
                <FeeLevelName>{selectedFeeLevel.value}</FeeLevelName>
                <StyledP>{ selectedFeeLevel.label }</StyledP>
            </Content>
        </Wrapper>
    );
};

ConfirmSignTx.propTypes = {
    device: PropTypes.object.isRequired,
    sendForm: PropTypes.object.isRequired,
};

export default ConfirmSignTx;