import React, { FunctionComponent } from 'react';
import styled from 'styled-components';
import { Prompt } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import { TrezorDevice } from '@suite-types';

import l10nMessages from './messages';

interface Props {
    device: TrezorDevice;
}

const Wrapper = styled.div``;

const Header = styled.div`
    padding: 48px;
`;

const ConfirmAction: FunctionComponent<Props> = ({ device }) => {
    const majorVersion = device.features ? device.features.major_version : 2;

    return (
        <Wrapper>
            <Header>
                <Prompt model={majorVersion} size={32}>
                    <Translation
                        {...l10nMessages.TR_CONFIRM_ACTION_ON_YOUR}
                        values={{ deviceLabel: device.label }}
                    />
                </Prompt>
            </Header>
        </Wrapper>
    );
};

export default ConfirmAction;
