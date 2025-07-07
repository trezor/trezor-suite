import styled from 'styled-components';

import { typography } from '@trezor/theme';

import { TrezorLink } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';
import { useSelector } from 'src/hooks/suite';
import { useBridgeDesktopApi } from 'src/hooks/suite/useBridgeDesktopApi';
import { useOpenSuiteDesktop } from 'src/hooks/suite/useOpenSuiteDesktop';
import { selectTransportOfType } from 'src/reducers/suite/suiteReducer';

export const Wrapper = styled.div`
    a {
        ${typography.hint};
    }
`;

export const SuiteDesktopTip = () => {
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
            id="TR_TROUBLESHOOTING_TIP_TRANSPORT_STATUS_DESCRIPTION"
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

/**
 * should only be rendered for desktop when built-in bridge is running
 */
export const BridgeToggle = () => {
    const { changeBridgeSettings, bridgeSettings, toggleBridge, bridgeProcess } =
        useBridgeDesktopApi();
    const bridge = useSelector(selectTransportOfType('BridgeTransport'));

    if (!bridgeSettings) return null;

    return (
        <Wrapper>
            <Translation
                id="TR_TROUBLESHOOTING_TIP_SUITE_DESKTOP_TOGGLE_ALT_DESCRIPTION"
                values={{
                    currentVersion: bridge?.version || 'unknown', // unknown should not happen, if bridge process is running
                    a: chunks => (
                        <TrezorLink
                            variant="underline"
                            onClick={() => {
                                changeBridgeSettings({
                                    ...bridgeSettings,
                                    legacy: !bridgeSettings?.legacy,
                                });

                                // if bridge process is not running it might make sense to toggle it on and also
                                // try to switch between legacy and node implementation (= who knows why it didn't start?)
                                if (!bridgeProcess.process) {
                                    // to get some sentry insights
                                    console.error(
                                        'Bridge process was not running and user toggled it in troubleshooting tips',
                                    );
                                    toggleBridge();
                                }
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
