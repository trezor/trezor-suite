import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled, { css } from 'styled-components';
import { H2, Link, variables, colors, Modal } from '@trezor/components';
import { PinInput, Loading, Translation, Image } from '@suite-components';
import { Dispatch, TrezorDevice } from '@suite-types';

import { URLS } from '@suite-constants';
import * as modalActions from '@suite-actions/modalActions';

const { FONT_SIZE, SCREEN_SIZE } = variables;

const Wrapper = styled.div`
    /* padding: 40px 40px 20px 40px; */
    display: flex;
    flex-direction: row;

    @media only screen and (max-width: ${SCREEN_SIZE.MD}) {
        flex-direction: column;
    }
`;

// Hackish hiding of close icon (x in top-left corner). I have no control
// over its rendering here as it renders automatically if cancelable prop
// is provided in modals/index
const HideCloseIconWrapper = styled.div`
    z-index: 1;
    background-color: white;
`;

const Col = styled.div<{ gray?: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 405px;
    padding: 40px 40px 20px 40px;

    @media only screen and (max-width: ${SCREEN_SIZE.MD}) {
        align-self: center;
    }

    ${props =>
        props.gray &&
        css`
            background: ${colors.BLACK96};
        `}
`;

const Expand = styled.div`
    flex: 1;
`;

const How = styled.div`
    color: ${colors.BLACK50};
    font-size: ${FONT_SIZE.SMALL};
    text-align: center;
`;

const Text = styled(How)`
    margin-bottom: 15px;
`;

const StyledImg = styled(props => <Image {...props} />)`
    padding: 35px;
`;

const ExplanationCol = (props: { heading: React.ReactNode; description?: React.ReactNode }) => (
    <Col gray>
        <H2>{props.heading}</H2>
        {props.description && props.description}
        <Expand>
            <StyledImg image="SET_UP_PIN_DIALOG" />
        </Expand>
        <How>
            <Translation id="TR_HOW_PIN_WORKS" />{' '}
            <Link href={URLS.PIN_MANUAL_URL}>
                <Translation id="TR_LEARN_MORE_LINK" />
            </Link>
        </How>
    </Col>
);
const mapDispatchToProps = (dispatch: Dispatch) => ({
    onPinSubmit: bindActionCreators(modalActions.onPinSubmit, dispatch),
});

type Props = {
    device: TrezorDevice;
    onCancel: () => void;
} & ReturnType<typeof mapDispatchToProps>;

const Pin = ({ device, onPinSubmit }: Props) => {
    const [submitted, setSubmitted] = useState(false);

    const counter =
        (device.features && device.buttonRequests.filter(b => b === 'ui-request_pin').length) || 0;

    const invalidCounter =
        (device.features && device.buttonRequests.filter(b => b === 'ui-invalid_pin').length) || 0;

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
        return (
            <HideCloseIconWrapper>
                <Loading />
            </HideCloseIconWrapper>
        );
    }

    // 3 cases when we want to show left column
    const isChangingPin = features?.pin_protection && features?.pin_cached;
    const isSettingNewPin = !features?.pin_protection;
    const enteredWrongPin =
        features?.pin_protection && !features?.pin_cached && invalidCounter >= 1;

    // TODO: figure out responsive design
    return (
        <Modal padding="0px" paddingSmall="0px" useFixedWidth={false}>
            <Wrapper>
                {isSettingNewPin && (
                    <ExplanationCol
                        heading={
                            <>
                                {counter === 1 && <Translation id="TR_SET_UP_NEW_PIN" />}
                                {counter === 2 && <Translation id="TR_CONFIRM_PIN" />}
                            </>
                        }
                        description={
                            <>
                                <Text>
                                    <Translation id="TR_SET_UP_STRONG_PIN_TO_PROTECT" />
                                </Text>
                                <Text>
                                    <Translation id="TR_MAXIMUM_LENGTH_IS_9_DIGITS" />
                                </Text>
                            </>
                        }
                    />
                )}
                {isChangingPin && (
                    <ExplanationCol
                        heading={
                            <>
                                {counter === 1 && <Translation id="TR_ENTER_CURRENT_PIN" />}
                                {counter === 2 && <Translation id="TR_SET_UP_NEW_PIN" />}
                                {counter === 3 && <Translation id="TR_CONFIRM_NEW_PIN" />}
                            </>
                        }
                        description={
                            <>
                                <Text>
                                    <Translation id="TR_SET_UP_STRONG_PIN_TO_PROTECT" />
                                </Text>
                                <Text>
                                    <Translation id="TR_MAXIMUM_LENGTH_IS_9_DIGITS" />
                                </Text>
                            </>
                        }
                    />
                )}
                {enteredWrongPin && (
                    <ExplanationCol
                        heading={<Translation id="TR_WRONG_PIN_ENTERED" />}
                        description={
                            <>
                                <Text>
                                    <Translation id="TR_WRONG_PIN_ENTERED_DESCRIPTION" />
                                </Text>
                            </>
                        }
                    />
                )}

                <Col>
                    <H2>
                        <Translation
                            id="TR_ENTER_PIN"
                            values={{
                                deviceLabel: device.label,
                            }}
                        />
                    </H2>
                    <How>
                        <Translation id="TR_THE_PIN_LAYOUT_IS_DISPLAYED" />
                    </How>
                    <PinInput onPinSubmit={submit} />
                </Col>
            </Wrapper>
        </Modal>
    );
};

export default connect(null, mapDispatchToProps)(Pin);
