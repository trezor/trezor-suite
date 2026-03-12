import { useRef, useState } from 'react';

import { selectDeviceStaticSessionId } from '@suite-common/device';
import { NetworkSymbol } from '@suite-common/wallet-config';
import type { AccountDescriptor } from '@suite-common/wallet-types';
import { Button, Column, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { useSuiteServices } from 'src/support/SuiteServicesProvider';

// Each address entry creates a new Evolu row (~490 byte label + ~200 byte overhead ≈ 690 bytes).
// 2200 iterations covers ~1.07 MB which should exhaust the 1 MB device quota.
const FILL_QUOTA_LABEL = 'a'.repeat(490);
const FILL_QUOTA_ITERATIONS = 2200;
const DEBUG_ACCOUNT_DESCRIPTOR = 'debug-fill-quota-account' as AccountDescriptor;
const DEBUG_NETWORK_SYMBOL = 'btc' as NetworkSymbol;

type FillStatus = 'idle' | 'filling' | 'stopped' | 'done' | 'error';

export const FillSuiteSyncQuota = () => {
    const { suiteSync } = useSuiteServices();

    const deviceStaticSessionId = useSelector(selectDeviceStaticSessionId);

    const [status, setStatus] = useState<FillStatus>('idle');
    const [fillProgress, setFillProgress] = useState(0);
    const shouldStopRef = useRef(false);

    const handleFillQuota = async () => {
        if (!deviceStaticSessionId) return;

        shouldStopRef.current = false;
        setStatus('filling');
        setFillProgress(0);

        const runId = Date.now();

        for (let i = 0; i < FILL_QUOTA_ITERATIONS; i++) {
            if (shouldStopRef.current) {
                setStatus('stopped');

                return;
            }

            const result = await suiteSync.labeling.updateAddressLabel({
                deviceStaticSessionId,
                address: `debug-fill-quota-${runId}-${i}`,
                label: FILL_QUOTA_LABEL,
                accountDescriptor: DEBUG_ACCOUNT_DESCRIPTOR,
                networkSymbol: DEBUG_NETWORK_SYMBOL,
            });

            await new Promise(r => setTimeout(r, 300));

            setFillProgress(i + 1);

            if (!result.success) {
                setStatus('error');

                return;
            }
        }

        setStatus('done');
    };

    const handleStop = () => {
        shouldStopRef.current = true;
    };

    const isDisabled = !deviceStaticSessionId || status === 'filling';

    return (
        <SectionItem>
            <TextColumn
                title="Fill Quota"
                description="Writes ~1 MB of label data to the Evolu relay to exhaust the device's Suite Sync quota. "
            />
            <ActionColumn>
                <Column gap={spacings.xxs}>
                    <Button
                        data-testid="@settings/debug/suite-sync/fill-quota-button"
                        onClick={handleFillQuota}
                        isLoading={status === 'filling'}
                        isDisabled={isDisabled}
                        intent="critical"
                    >
                        {status === 'filling'
                            ? `Filling… ${fillProgress} / ${FILL_QUOTA_ITERATIONS}`
                            : 'Fill Quota'}
                    </Button>
                    {status === 'filling' && (
                        <Button
                            data-testid="@settings/debug/suite-sync/stop-fill-quota-button"
                            onClick={handleStop}
                        >
                            Stop
                        </Button>
                    )}
                    {status === 'stopped' && (
                        <Text typographyStyle="body-sm" color="textSubdued">
                            Stopped after {fillProgress} / {FILL_QUOTA_ITERATIONS} writes.
                        </Text>
                    )}
                    {status === 'done' && (
                        <Text typographyStyle="body-sm" color="textSubdued">
                            Done. Navigate to the home screen to see the Out of Quota banner.
                        </Text>
                    )}
                    {status === 'error' && (
                        <Text typographyStyle="body-sm" color="textAlertRed">
                            Write failed. Check that Suite Sync is enabled and a device is
                            connected.
                        </Text>
                    )}
                    {!deviceStaticSessionId && status === 'idle' && (
                        <Text typographyStyle="body-sm" color="textSubdued">
                            No active device session found.
                        </Text>
                    )}
                </Column>
            </ActionColumn>
        </SectionItem>
    );
};
