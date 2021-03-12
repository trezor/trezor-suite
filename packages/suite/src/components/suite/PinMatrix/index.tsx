import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { DeviceMatrixExplanation, PinInput, Translation, TrezorLink } from '@suite-components';
import { TrezorDevice } from '@suite-types';
import { URLS } from '@suite-constants';
import * as modalActions from '@suite-actions/modalActions';
import { useActions, useTheme } from '@suite-hooks';

const Wrapper = styled.div`
    display: flex;
    flex-direction: row;
    flex: 1;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        flex-direction: column;
    }
`;

const Col = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    border-radius: 5px;
    width: 100%;
    max-width: 340px;
`;
interface Props {
    device: TrezorDevice;
    hideExplanation?: boolean;
    invalid?: boolean;
}

const PinMatrix = ({ device, hideExplanation, invalid }: Props) => {
    const { theme } = useTheme();
    const [submitted, setSubmitted] = useState(false);
    const { onPinSubmit } = useActions({ onPinSubmit: modalActions.onPinSubmit });
    const pinRequestType = device.buttonRequests[device.buttonRequests.length - 1];

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

    return (
        <Wrapper>
            {!hideExplanation && (
                <DeviceMatrixExplanation
                    items={[
                        invalid
                            ? {
                                  key: 'invalid',
                                  title: <Translation id="TR_WRONG_PIN_ENTERED" />,
                                  icon: 'WARNING_ACTIVE',
                                  iconSize: 40,
                                  iconColor: theme.TYPE_RED,
                              }
                            : {
                                  key: 'matrix',
                                  title: <Translation id="TR_PIN_MATRIX_DISPLAYED_ON_TREZOR" />,
                                  deviceImage: 1,
                              },
                        {
                            key: 'maxlength',
                            title: <Translation id="TR_MAXIMUM_LENGTH_IS_9_DIGITS" />,
                            icon: 'ASTERISK',
                            iconSize: 20,
                        },
                        {
                            key: 'pin',
                            title: (
                                <TrezorLink variant="underline" href={URLS.PIN_MANUAL_URL}>
                                    <Translation id="TR_HOW_PIN_WORKS" />
                                </TrezorLink>
                            ),
                            icon: 'PIN',
                        },
                    ]}
                />
            )}
            <Col>
                <PinInput isSubmitting={submitted} onPinSubmit={submit} />
            </Col>
        </Wrapper>
    );
};

export default PinMatrix;
