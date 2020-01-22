import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { variables as oldVariables } from '@trezor/components';
import { H2, Link, variables, colors } from '@trezor/components-v2';
import { Translation } from '@suite-components/Translation';
import Loading from '@suite-components/Loading';
import { PinInput } from '@suite-components';
import { Dispatch, TrezorDevice } from '@suite-types';
import messages from '@suite/support/messages';
import { URLS } from '@suite-constants';
import * as modalActions from '@suite-actions/modalActions';
import { resolveStaticPath } from '@suite-utils/nextjs';

const { FONT_SIZE } = variables;
const { SCREEN_SIZE } = oldVariables;

const ModalWrapper = styled.div`
    padding: 30px 45px;
    display: flex;
    flex-direction: row;

    @media only screen and (max-width: ${SCREEN_SIZE.SM}) {
        flex-direction: column;
    }
`;

const Col = styled.div`
    width: 356px;
`;

const Text = styled.div`
    color: ${colors.BLACK50};
    font-size: ${FONT_SIZE.SMALL};
    margin-bottom: 15px;
`;

const BottomMessage = styled(Text)`
    margin: 20px 30px 0;
`;

const StyledImg = styled.img`
    padding: 35px;
`;

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onPinSubmit: bindActionCreators(modalActions.onPinSubmit, dispatch),
});

type Props = {
    device: TrezorDevice;
} & ReturnType<typeof mapDispatchToProps>;

const Pin = ({ device, onPinSubmit }: Props) => {
    const [submitted, setSubmitted] = useState(false);

    const counter =
        (device.features && device.buttonRequests.filter(b => b === 'ui-request_pin').length) || 0;

    useEffect(() => {
        setSubmitted(false);
    }, [counter]);

    if (!device.features) return null;

    const { features } = device;

    const submit = (pin: string) => {
        onPinSubmit(pin);
        setSubmitted(true);
    };

    if (submitted) {
        return <Loading />;
    }

    return (
        <ModalWrapper>
            {!features?.pin_protection && (
                <Col>
                    <H2>Set up new PIN</H2>
                    <Text>
                        Set up a strong PIN to protect your device from unauthorized access. The
                        keypad layout is displayed on your connected Trezor device.
                    </Text>
                    <Text>Maximum length is 9 digits.</Text>
                    <StyledImg src={resolveStaticPath('images/suite/set-up-pin-dialog.svg')} />
                    {!features?.pin_protection && (
                        <Text>
                            <Translation {...messages.TR_HOW_PIN_WORKS} />{' '}
                            <Link href={URLS.PIN_MANUAL_URL}>
                                <Translation {...messages.TR_LEARN_MORE_LINK} />
                            </Link>
                        </Text>
                    )}
                </Col>
            )}
            <Col>
                <H2>
                    {counter === 1 && (
                        <Translation
                            {...messages.TR_ENTER_PIN}
                            values={{
                                deviceLabel: device.label,
                            }}
                        />
                    )}
                    {counter > 1 && <Translation {...messages.TR_CONFIRM_PIN} />}
                </H2>
                <Text>
                    <Translation {...messages.TR_THE_PIN_LAYOUT_IS_DISPLAYED} />
                </Text>
                <PinInput onPinSubmit={submit} />
                {features?.pin_protection && (
                    <BottomMessage>
                        <Translation {...messages.TR_HOW_PIN_WORKS} />{' '}
                        <Link href={URLS.PIN_MANUAL_URL}>
                            <Translation {...messages.TR_LEARN_MORE_LINK} />
                        </Link>
                    </BottomMessage>
                )}
            </Col>
        </ModalWrapper>
    );
};

export default connect(null, mapDispatchToProps)(Pin);
