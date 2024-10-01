import styled from 'styled-components';

import { typography } from '@trezor/theme';

import { TrezorLink } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';
import { useOpenSuiteDesktop } from 'src/hooks/suite/useOpenSuiteDesktop';

const Wrapper = styled.div`
    a {
        ${typography.hint};
    }
`;

export const BridgeInstall = () => {
    const handleClick = useOpenSuiteDesktop();

    return (
        <Wrapper>
            <Translation
                id="TR_TROUBLESHOOTING_TIP_SUITE_DESKTOP_DESCRIPTION"
                values={{
                    a: chunks => (
                        <TrezorLink variant="underline" onClick={handleClick}>
                            {chunks}
                        </TrezorLink>
                    ),
                }}
            />
        </Wrapper>
    );
};

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
