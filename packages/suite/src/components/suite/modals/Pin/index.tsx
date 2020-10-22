import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { H2, Link, variables, colors, Modal, ModalProps } from '@trezor/components';
import { PinInput, Loading, Translation, Image } from '@suite-components';
import { TrezorDevice } from '@suite-types';

import { URLS } from '@suite-constants';
import * as modalActions from '@suite-actions/modalActions';
import { useActions } from '@suite-hooks';

const { FONT_SIZE, SCREEN_SIZE } = variables;

const Wrapper = styled.div`
    display: flex;
    flex-direction: row;
    flex: 1;

    @media only screen and (max-width: ${SCREEN_SIZE.MD}) {
        flex-direction: column;
    }
`;

const Col = styled.div<{ noYPadding?: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 348px;
    height: 100%;
    /* no vertical padding if the modal is used as inner modal (eg. inside Recovery) */
    padding: ${props => (props.noYPadding ? '0px 40px' : '30px 40px 30px 40px')};

    @media only screen and (max-width: ${SCREEN_SIZE.MD}) {
        align-self: center;
    }
`;

const GreyCol = styled(Col)`
    background: ${colors.BLACK96};
    @media only screen and (max-width: ${SCREEN_SIZE.MD}) {
        display: none;
    }
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
    margin-bottom: 14px;
`;

const StyledImg = styled(props => <Image {...props} />)`
    padding: 34px;
`;

interface TextComponentProps {
    pinRequestType: string;
    invalid: boolean;
}

const PinHeading = ({ pinRequestType, invalid }: TextComponentProps) => {
    if (invalid) {
        return <Translation id="TR_WRONG_PIN_ENTERED" />;
    }
    switch (pinRequestType) {
        case 'PinMatrixRequestType_Current':
            return <Translation id="TR_ENTER_CURRENT_PIN" />;
        case 'PinMatrixRequestType_NewFirst':
            return <Translation id="TR_SET_UP_NEW_PIN" />;
        case 'PinMatrixRequestType_NewSecond':
            return <Translation id="TR_CONFIRM_PIN" />;
        default:
            return null;
    }
};

const PinDescription = ({ pinRequestType, invalid }: TextComponentProps) => {
    if (invalid) {
        return (
            <Text>
                <Translation id="TR_WRONG_PIN_ENTERED_DESCRIPTION" />
            </Text>
        );
    }
    switch (pinRequestType) {
        case 'PinMatrixRequestType_Current':
            return <Translation id="TR_ENTER_CURRENT_PIN" />;
        case 'PinMatrixRequestType_NewFirst':
        case 'PinMatrixRequestType_NewSecond':
            return (
                <>
                    <Text>
                        <Translation id="TR_SET_UP_STRONG_PIN_TO_PROTECT" />
                    </Text>
                    <Text>
                        <Translation id="TR_MAXIMUM_LENGTH_IS_9_DIGITS" />
                    </Text>
                </>
            );
        default:
            return null;
    }
};

const ExplanationCol = (props: { heading: React.ReactNode; description?: React.ReactNode }) => (
    <GreyCol>
        <H2>{props.heading}</H2>
        {props.description && props.description}
        <Expand>
            <StyledImg image="SET_UP_PIN_DIALOG" />
        </Expand>
        <How>
            <Translation id="TR_HOW_PIN_WORKS" />{' '}
            <Link href={URLS.PIN_MANUAL_URL}>
                <Translation id="TR_LEARN_MORE" />
            </Link>
        </How>
    </GreyCol>
);

interface OwnProps extends ModalProps {
    device: TrezorDevice;
    cancelable?: boolean;
    noBackground?: boolean;
    onCancel: () => void;
}

type Props = OwnProps;

const Pin = ({ device, cancelable, noBackground, ...rest }: Props) => {
    const [submitted, setSubmitted] = useState(false);
    const { onPinSubmit } = useActions({ onPinSubmit: modalActions.onPinSubmit });

    const pinRequestType = device.buttonRequests[device.buttonRequests.length - 1];
    const invalidCounter = device.buttonRequests.filter(r => r === 'ui-invalid_pin').length || 0;

    useEffect(() => {
        if (
            [
                'PinMatrixRequestType_NewFirst',
                'PinMatrixRequestType_NewSecond',
                'PinMatrixRequestType_Current',
            ].includes(pinRequestType)
        ) {
            setSubmitted(false);
        }
    }, [pinRequestType]);

    if (!device.features) return null;

    const submit = (pin: string) => {
        onPinSubmit(pin);
        setSubmitted(true);
    };

    if (submitted) {
        return <Loading />;
    }

    // 3 cases when we want to show left column
    const isExtended =
        ['PinMatrixRequestType_NewFirst', 'PinMatrixRequestType_NewSecond'].includes(
            pinRequestType,
        ) || invalidCounter > 0;

    // TODO: figure out responsive design
    return (
        <Modal
            noPadding
            useFixedWidth={false}
            cancelable={cancelable}
            noBackground={noBackground}
            {...rest}
        >
            <Wrapper>
                {isExtended && (
                    <ExplanationCol
                        heading={
                            <PinHeading
                                pinRequestType={pinRequestType}
                                invalid={invalidCounter > 0}
                            />
                        }
                        description={
                            <PinDescription
                                pinRequestType={pinRequestType}
                                invalid={invalidCounter > 0}
                            />
                        }
                    />
                )}
                <Col noYPadding={noBackground}>
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

export default Pin;
