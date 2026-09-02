import { useEffect, useState } from 'react';

import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { useDispatch } from '@suite-common/redux-utils';
import { Banner } from '@trezor/components';
import { isWeb } from '@trezor/env-utils';

import { useLocalNetworkAccessPermission } from 'src/hooks/suite/useLocalNetworkAccessPermission';

const LEGACY_BRIDGE_URL = 'http://127.0.0.1:21325/';
const LEGACY_BRIDGE_PROBE_TIMEOUT_MS = 5_000;

/**
 * Detects whether legacy standalone trezord-go (port 21325) is running on the system.
 *
 * On Suite Desktop the probe always runs. On Suite Web the probe only runs when the
 * Local Network Access permission is already `granted` — issuing a `fetch` against
 * `127.0.0.1` under Chrome's Private Network Access rules would otherwise trigger a
 * permission prompt, and prompting the user just to surface a deprecation banner is
 * the wrong tradeoff. If the user later grants LNA for the main transport, the
 * permission state changes and the effect re-runs.
 *
 * The probe only flags a `2.x` version string. All known legacy `trezord-go` builds
 * report `2.x`; the modern node-bridge reports `3.x` and would not trigger even if a
 * user happened to bind it to port 21325. Unrelated services that happen to respond
 * with a different `version` shape on that port are ignored.
 *
 * Edge case: the old bridge should not be present in practice anymore. Detection
 * runs once on mount, no retry/interval — if the user starts the old bridge after
 * Suite boots, the banner appears only after the next reload.
 */
export const useLegacyBridgeDetection = () => {
    const [detected, setDetected] = useState(false);
    const { localNetworkAccessPermission } = useLocalNetworkAccessPermission();
    const shouldProbe = !isWeb() || localNetworkAccessPermission === 'granted';

    useEffect(() => {
        if (!shouldProbe) return;

        let isMounted = true;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), LEGACY_BRIDGE_PROBE_TIMEOUT_MS);

        fetch(LEGACY_BRIDGE_URL, { method: 'POST', signal: controller.signal })
            .then(r => (r.ok ? r.json() : null))
            .then(data => {
                if (!isMounted) return;
                if (typeof data?.version === 'string' && data.version.startsWith('2.')) {
                    setDetected(true);
                }
            })
            .catch(() => {})
            .finally(() => clearTimeout(timeoutId));

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [shouldProbe]);

    return detected;
};

export const BridgeDeprecated = () => {
    const dispatch = useDispatch();

    return (
        <Banner
            icon
            intent="info"
            rightContent={
                <Banner.Button
                    onClick={() => dispatch(gotoThunk({ routeName: 'suite-bridge-deprecated' }))}
                    data-testid="@notification/bridge-deprecated/button"
                >
                    <Translation id="TR_LEARN_MORE" />
                </Banner.Button>
            }
            description={<Translation id="TR_STANDALONE_BRIDGE_DEPRECATED" />}
        />
    );
};
