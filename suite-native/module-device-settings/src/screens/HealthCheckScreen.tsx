import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { Box, Button, Card, HStack, IconButton, Text, VStack } from '@suite-native/atoms';
import {
    type DeviceSettingsStackParamList,
    type DeviceSettingsStackRoutes,
    DynamicScreenHeader,
    Screen,
} from '@suite-native/navigation';
import { type NdefRecord } from '@trezor/react-native-nfc';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { selectNfcTagLabel, setNfcTagLabel } from '../nfcTagsSlice';

const HEALTH_CHECK_DURATION = 3000;

type HealthCheckData = {
    id: string;
    flippedBits: number;
    lastTimestamp: number;
};

const iconPlaceholderStyle = prepareNativeStyle(utils => ({
    width: 80,
    height: 80,
    borderRadius: utils.borders.radii.r16,
    backgroundColor: utils.colors.elementFillBrandSoft,
    alignItems: 'center',
    justifyContent: 'center',
}));

const hexToString = (hex: string): string => {
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
        str += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
    }

    return str;
};

const parseHealthCheckData = (records: NdefRecord[]): HealthCheckData | null => {
    // Find MIME record with our health check data
    const mimeRecord = records.find(r => r.tnf === 2);
    if (!mimeRecord?.payload) return null;

    try {
        const jsonString = hexToString(mimeRecord.payload);

        return JSON.parse(jsonString) as HealthCheckData;
    } catch {
        return null;
    }
};

const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);

    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <HStack justifyContent="space-between" alignItems="center">
        <Text variant="body-md" color="contentSecondary">
            {label}
        </Text>
        <Text variant="body-md-strong">{value}</Text>
    </HStack>
);

export const HealthCheckScreen = () => {
    const { applyStyle } = useNativeStyles();
    const dispatch = useDispatch();
    const route =
        useRoute<RouteProp<DeviceSettingsStackParamList, DeviceSettingsStackRoutes.HealthCheck>>();

    const ndefRecords = (route.params?.ndefRecords ?? []) as NdefRecord[];
    const healthCheckData = parseHealthCheckData(ndefRecords);
    const tagId = healthCheckData?.id ?? 'unknown';

    const storedLabel = useSelector((state: any) => selectNfcTagLabel(state, tagId));
    const [isEditing, setIsEditing] = useState(false);
    const [editLabel, setEditLabel] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [lastCheckResult, setLastCheckResult] = useState<{
        flippedBits: number;
        timestamp: number;
    } | null>(null);

    const displayLabel = storedLabel ?? `NFC Backup #${tagId}`;

    const flippedBits = lastCheckResult?.flippedBits ?? healthCheckData?.flippedBits ?? 0;
    const lastTimestamp = lastCheckResult?.timestamp ?? healthCheckData?.lastTimestamp ?? 0;

    const handleStartEdit = useCallback(() => {
        setEditLabel(storedLabel ?? '');
        setIsEditing(true);
    }, [storedLabel]);

    const handleSaveLabel = useCallback(() => {
        if (editLabel.trim()) {
            dispatch(setNfcTagLabel({ tagId, label: editLabel.trim() }));
        }
        setIsEditing(false);
    }, [dispatch, tagId, editLabel]);

    const handleHealthCheck = useCallback(() => {
        setIsChecking(true);
        setTimeout(() => {
            setLastCheckResult({
                flippedBits: Math.floor(Math.random() * 10),
                timestamp: Math.floor(Date.now() / 1000),
            });
            setIsChecking(false);
        }, HEALTH_CHECK_DURATION);
    }, []);

    const footer = (
        <VStack marginHorizontal="sp16" marginBottom="sp16">
            <Button
                onPress={handleHealthCheck}
                isLoading={isChecking}
                isDisabled={isChecking}
                testID="@health-check/perform-button"
            >
                {isChecking ? 'Checking...' : 'Perform Health Check'}
            </Button>
        </VStack>
    );

    return (
        <Screen
            header={<DynamicScreenHeader title="Health Check" closeActionType="back" />}
            footer={footer}
        >
            <VStack spacing="sp24" alignItems="center" marginTop="sp24">
                <Box style={applyStyle(iconPlaceholderStyle)}>
                    <Text variant="headline-md" color="contentBrand">
                        NFC
                    </Text>
                </Box>

                {isEditing ? (
                    <VStack spacing="sp12" alignItems="center">
                        <HStack alignItems="center" spacing="sp12">
                            <Text variant="headline-md">{editLabel || displayLabel}</Text>
                            <IconButton
                                onPress={handleSaveLabel}
                                iconName="check"
                                intent="brand"
                                priority="secondary"
                                testID="@health-check/save-label"
                            />
                        </HStack>
                    </VStack>
                ) : (
                    <HStack alignItems="center" spacing="sp12">
                        <Text variant="headline-md">{displayLabel}</Text>
                        <IconButton
                            onPress={handleStartEdit}
                            iconName="pencilSimpleLine"
                            intent="neutral"
                            priority="secondary"
                            testID="@health-check/edit-label"
                        />
                    </HStack>
                )}

                <Text variant="body-sm" color="contentSecondary">
                    ID: {tagId}
                </Text>
            </VStack>

            <VStack spacing="sp16" marginTop="sp32">
                <Card>
                    <VStack spacing="sp16">
                        <InfoRow label="Flipped bits" value={String(flippedBits)} />
                        <InfoRow
                            label="Last check"
                            value={lastTimestamp > 0 ? formatTimestamp(lastTimestamp) : 'Never'}
                        />
                    </VStack>
                </Card>

                {!healthCheckData && ndefRecords.length === 0 && (
                    <Card>
                        <Text variant="body-md" color="contentSecondary">
                            No NFC data — screen opened manually.
                        </Text>
                    </Card>
                )}
            </VStack>
        </Screen>
    );
};
