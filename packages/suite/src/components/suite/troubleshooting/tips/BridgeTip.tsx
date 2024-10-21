import styled from 'styled-components';

import { typography } from '@trezor/theme';

import { TrezorLink } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';
import { useOpenSuiteDesktop } from 'src/hooks/suite/useOpenSuiteDesktop';
import { useBridgeDesktopApi } from 'src/hooks/suite/useBridgeDesktopApi';
import { useSelector } from 'src/hooks/suite';

export const Wrapper = styled.div`
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

export const BridgeToggle = () => {
    const { changeBridgeSettings, bridgeSettings } = useBridgeDesktopApi();
    const transport = useSelector(state => state.suite.transport);

    if (!bridgeSettings) return null;

    return (
        <Wrapper>
            <Translation
                id="TR_TROUBLESHOOTING_TIP_SUITE_DESKTOP_TOGGLE_BRIDGE_DESCRIPTION"
                values={{
                    currentVersion: transport?.version,
                    a: chunks => (
                        <TrezorLink
                            variant="underline"
                            onClick={() => {
                                changeBridgeSettings({
                                    ...bridgeSettings,
                                    legacy: !bridgeSettings?.legacy,
                                });
                            }}
                        >
                            {chunks}
                        </TrezorLink>
                    ),
                }}
            />
        </Wrapper>
    );
};
