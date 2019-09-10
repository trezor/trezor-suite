import React, { FunctionComponent } from 'react';
import styled from 'styled-components';

import { P, Prompt } from '@trezor/components';
import { TrezorDevice } from '@suite-types';
import messages from './messages';
import { FormattedMessage } from 'react-intl';

interface Props {
    device: TrezorDevice;
}

const Wrapper = styled.div`
    max-width: 360px;
    padding: 30px 48px;
`;

const Header = styled.div``;

const PassphraseType: FunctionComponent<Props> = ({ device }) => {
    const majorVersion = device.features ? device.features.major_version : 2;

    return (
        <Wrapper>
            <Header>
                <Prompt model={majorVersion} size={32}>
                
                    <FormattedMessage
                        {...messages.TR_COMPLETE_ON_DEVICE}
                        values={{
                            deviceLabel: device.label,
                        }}
                    />
                </Prompt>

                <P size="small">
                    <FormattedMessage {...messages.TR_IF_WRONG_PASSPHRASE} />
                </P>
            </Header>
        </Wrapper>
    );
};

export default PassphraseType;
