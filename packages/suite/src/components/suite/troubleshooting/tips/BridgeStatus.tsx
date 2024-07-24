import { TrezorLink } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';
import { typography } from '@trezor/theme';
import styled from 'styled-components';

const Wrapper = styled.div`
    a {
        ${typography.hint};
    }
`;

export const BridgeStatus = () => (
    <Wrapper>
        <Translation
            id="TR_TROUBLESHOOTING_TIP_BRIDGE_STATUS_DESCRIPTION"
            values={{
                a: chunks => (
                    <TrezorLink variant="underline" href="http://127.0.0.1:21325/status/">
                        {chunks}
                    </TrezorLink>
                ),
            }}
        />
    </Wrapper>
);
