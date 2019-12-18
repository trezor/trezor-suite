import React from 'react';
import styled from 'styled-components';
import { Prompt } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import { TrezorDevice } from '@suite-types';

import messages from '@suite/support/messages';

interface Props {
    device: TrezorDevice;
}

const Wrapper = styled.div``;

const Header = styled.div`
    padding: 48px;
`;

const ConfirmAction = ({ device }: Props) => {
    const majorVersion = device.features ? device.features.major_version : 2;

    return (
        <Wrapper data-test="@suite/modal/confirm-action-on-device">
            <Header>
                <Prompt model={majorVersion} size={32}>
                    <Translation
                        {...messages.TR_CONFIRM_ACTION_ON_YOUR}
                        values={{ deviceLabel: device.label }}
                    />
                </Prompt>
            </Header>
        </Wrapper>
    );
};

export default ConfirmAction;
