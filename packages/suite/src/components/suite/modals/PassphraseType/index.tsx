import React, { FunctionComponent } from 'react';
import styled from 'styled-components';

import { P, Prompt } from '@trezor/components';
import { TrezorDevice } from '@suite-types';

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
                    Complete the action on "{device.label}" device
                </Prompt>

                <P size="small">
                    If you enter a wrong passphrase, you will not unlock the desired hidden wallet.
                </P>
            </Header>
        </Wrapper>
    );
};

export default PassphraseType;
