import React from 'react';
import styled from 'styled-components';

import { P, H2, Link } from '@trezor/components-v2';
import { FormattedMessage } from 'react-intl';
import { PinInput } from '@suite-components';
import { TrezorDevice } from '@suite-types';

import messages from './messages';
import globalMessages from '@suite-support/Messages';

import { URLS } from '@suite-constants';

const ModalWrapper = styled.div`
    padding: 30px 45px;
    width: 356px;
`;

const TopMessage = styled(P)``;

const BottomMessage = styled(P)`
    margin: 20px 30px 0;
`;

interface Props {
    device: TrezorDevice;
    onEnterPin: (value: string) => void;
}

const Pin = ({ device, onEnterPin }: Props) => {
    return (
        <ModalWrapper>
            <H2>
                <FormattedMessage
                    {...globalMessages.TR_ENTER_PIN}
                    values={{
                        deviceLabel: device.label,
                    }}
                />
            </H2>
            <TopMessage size="small">
                <FormattedMessage {...messages.TR_THE_PIN_LAYOUT_IS_DISPLAYED} />
            </TopMessage>
            <PinInput onPinSubmit={onEnterPin} />
            <BottomMessage size="small">
                <FormattedMessage {...messages.TR_HOW_PIN_WORKS} />{' '}
                <Link href={URLS.PIN_MANUAL_URL}>
                    <FormattedMessage {...globalMessages.TR_LEARN_MORE_LINK} />
                </Link>
            </BottomMessage>
        </ModalWrapper>
    );
};

export default Pin;
