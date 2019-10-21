import React from 'react';
import styled from 'styled-components';

import { P, H5, Link } from '@trezor/components';
import { FormattedMessage } from 'react-intl';
import { PinInput } from '@suite-components';
import { TrezorDevice } from '@suite-types';

import modalsMessages from '../messages';
import messages from './messages';
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
            <H5>
                <FormattedMessage
                    {...messages.TR_ENTER_PIN}
                    values={{
                        deviceLabel: device.label,
                    }}
                />
            </H5>
            <TopMessage size="small">
                <FormattedMessage {...messages.TR_THE_PIN_LAYOUT_IS_DISPLAYED} />
            </TopMessage>
            <PinInput onPinSubmit={onEnterPin} />
            <BottomMessage size="small">
                <FormattedMessage {...messages.TR_HOW_PIN_WORKS} />{' '}
                <Link href={URLS.PIN_MANUAL_URL}>
                    <FormattedMessage {...modalsMessages.TR_LEARN_MORE} />
                </Link>
            </BottomMessage>
        </ModalWrapper>
    );
};

export default Pin;
