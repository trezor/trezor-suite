import { useState, useEffect } from 'react';
import styled from 'styled-components';

import { variables, useTheme } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/connect';
import { HELP_CENTER_PIN_URL } from '@trezor/urls';

import { DeviceMatrixExplanation, Translation, TrezorLink } from 'src/components/suite';
import { TrezorDevice } from 'src/types/suite';
import { onPinSubmit } from 'src/actions/suite/modalActions';
import { useDispatch } from 'src/hooks/suite';
import { PinInput } from './PinInput/PinInput';

export const PIN_MATRIX_MAX_WIDTH = '316px';

const Wrapper = styled.div`
    display: flex;
    flex-direction: row;
    flex: 1;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        flex-direction: column;
    }

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        width: 100%;
    }
`;

const Col = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    border-radius: 5px;
    width: 100%;
    max-width: ${PIN_MATRIX_MAX_WIDTH};
`;
interface PinMatrixProps {
    device: TrezorDevice;
    hideExplanation?: boolean;
    invalid?: boolean;
}

export const PinMatrix = ({ device, hideExplanation, invalid }: PinMatrixProps) => {
    const theme = useTheme();
    const [submitted, setSubmitted] = useState(false);
    const dispatch = useDispatch();

    const pinRequestType = device.buttonRequests[device.buttonRequests.length - 1];

    useEffect(() => {
        if (
            pinRequestType?.code &&
            [
                'PinMatrixRequestType_Current',
                'PinMatrixRequestType_NewFirst',
                'PinMatrixRequestType_NewSecond',
                'PinMatrixRequestType_WipeCodeFirst',
                'PinMatrixRequestType_WipeCodeSecond',
            ].includes(pinRequestType.code)
        ) {
            setSubmitted(false);
        }
    }, [pinRequestType]);

    if (!device.features) return null;

    const submit = (pin: string) => {
        dispatch(onPinSubmit(pin));
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
                                  icon: 'WARNING',
                                  iconSize: 40,
                                  iconColor: theme.TYPE_RED,
                              }
                            : {
                                  key: 'matrix',
                                  title: <Translation id="TR_PIN_MATRIX_DISPLAYED_ON_TREZOR" />,
                                  deviceModelInternal: DeviceModelInternal.T1B1,
                              },
                        {
                            key: 'maxlength',
                            title: <Translation id="TR_MAXIMUM_PIN_LENGTH" />,
                            icon: 'ASTERISK',
                            iconSize: 20,
                        },
                        {
                            key: 'pin',
                            title: (
                                <TrezorLink variant="underline" href={HELP_CENTER_PIN_URL}>
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
