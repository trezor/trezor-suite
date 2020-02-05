import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled, { css } from 'styled-components';
import { H2, Link, variables, colors } from '@trezor/components-v2';
import { Translation } from '@suite-components/Translation';
import Loading from '@suite-components/Loading';
import { PinInput } from '@suite-components';
import { Dispatch, TrezorDevice } from '@suite-types';
import messages from '@suite/support/messages';
import { URLS } from '@suite-constants';
import * as modalActions from '@suite-actions/modalActions';
import { resolveStaticPath } from '@suite-utils/nextjs';

const { FONT_SIZE, SCREEN_SIZE } = variables;

const ModalWrapper = styled.div`
    /* padding: 40px 40px 20px 40px; */
    display: flex;
    flex-direction: row;

    @media only screen and (max-width: ${SCREEN_SIZE.MD}) {
        flex-direction: column;
    }
`;

const Col = styled.div<{ gray?: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 405px;
    padding: 40px 40px 20px 40px;

    ${props =>
        props.gray &&
        css`
            background: ${colors.BLACK96};
        `}
`;

const Expand = styled.div`
    flex: 1;
`;

const Description = styled.div`
    color: ${colors.BLACK50};
    font-size: ${FONT_SIZE.SMALL};
    text-align: center;
`;

const Text = styled(Description)`
    margin-bottom: 15px;
`;

const BottomMessage = styled(Description)`
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

    // TODO: figure out responsive design
    return (
        <ModalWrapper>
            {!features?.pin_protection && (
                <Col gray>
                    <H2>Set up new PIN</H2>
                    <Text>
                        Set up a strong PIN to protect your device from unauthorized access. The
                        keypad layout is displayed on your connected Trezor device.
                    </Text>
                    <Text>Maximum length is 9 digits.</Text>
                    <Expand>
                        <StyledImg src={resolveStaticPath('images/suite/set-up-pin-dialog.svg')} />
                    </Expand>
                    <Description>
                        <Translation {...messages.TR_HOW_PIN_WORKS} />{' '}
                        <Link href={URLS.PIN_MANUAL_URL}>
                            <Translation {...messages.TR_LEARN_MORE_LINK} />
                        </Link>
                    </Description>
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
                <Description>
                    <Translation {...messages.TR_THE_PIN_LAYOUT_IS_DISPLAYED} />
                </Description>
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
