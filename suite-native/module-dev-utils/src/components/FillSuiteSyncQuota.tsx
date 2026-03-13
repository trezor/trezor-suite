import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectDeviceStaticSessionId } from '@suite-common/device';
import { NetworkSymbol } from '@suite-common/wallet-config';
import type { AccountDescriptor } from '@suite-common/wallet-types';
import { Button, Card, Text, VStack } from '@suite-native/atoms';
import { useNativeServices } from '@suite-native/services';

const FILL_QUOTA_LABEL = 'a'.repeat(50);
const FILL_QUOTA_ITERATIONS = 4000;
const DEBUG_ACCOUNT_DESCRIPTOR = 'debug-fill-quota-account' as AccountDescriptor;
const DEBUG_NETWORK_SYMBOL = 'btc' as NetworkSymbol;

type FillStatus = 'idle' | 'filling' | 'stopped' | 'done' | 'error';

export const FillSuiteSyncQuota = () => {
    const { suiteSync } = useNativeServices();

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

            if (shouldStopRef.current) {
                setStatus('stopped');
                setFillProgress(i + 1);

                return;
            }

            if (shouldStopRef.current) {
                setStatus('stopped');
                setFillProgress(i + 1);

                return;
            }

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
        <Card>
            <VStack spacing="sp12">
                <Text variant="headline-sm">Fill Suite Sync Quota</Text>
                <Text variant="body-sm" color="textSubdued">
                    Writes ~1 MB of label data to the Evolu relay to exhaust the device&apos;s Suite
                    Sync quota.
                </Text>
                <Button colorScheme="redBold" onPress={handleFillQuota} isDisabled={isDisabled}>
                    {status === 'filling'
                        ? `Filling… ${fillProgress} / ${FILL_QUOTA_ITERATIONS}`
                        : 'Fill Quota'}
                </Button>
                {status === 'filling' && (
                    <Button colorScheme="tertiaryElevation0" onPress={handleStop}>
                        Stop
                    </Button>
                )}
                {status === 'stopped' && (
                    <Text variant="body-sm" color="textSubdued">
                        Stopped after {fillProgress} / {FILL_QUOTA_ITERATIONS} writes.
                    </Text>
                )}
                {status === 'done' && (
                    <Text variant="body-sm" color="textSubdued">
                        Done. Navigate to the home screen to see the Out of Quota banner.
                    </Text>
                )}
                {status === 'error' && (
                    <Text variant="body-sm" color="textAlertRed">
                        Write failed. Check that Suite Sync is enabled and a device is connected.
                    </Text>
                )}
                {!deviceStaticSessionId && status === 'idle' && (
                    <Text variant="body-sm" color="textSubdued">
                        No active device session found.
                    </Text>
                )}
            </VStack>
        </Card>
    );
};
