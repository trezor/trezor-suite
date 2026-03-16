import { TitleHeader, VStack } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';

import { type BluetoothDevice } from '../types';
import { BluetoothDeviceCard } from './BluetoothDeviceCard';

type Variant = 'connect' | 'remove';

type BluetoothDeviceListProps = {
    variant: Variant;
    devices: BluetoothDevice[];
    onDeviceButtonPress: (device: BluetoothDevice) => void;
};

type BluetoothDeviceListTranslations = {
    title: TxKeyPath;
    subtitle: TxKeyPath;
};

const variantToTranslationsMap = {
    connect: {
        title: 'bluetooth.deviceList.connect.title',
        subtitle: 'bluetooth.deviceList.connect.subtitle',
    },
    remove: {
        title: 'bluetooth.deviceList.remove.title',
        subtitle: 'bluetooth.deviceList.remove.subtitle',
    },
} as const satisfies Record<Variant, BluetoothDeviceListTranslations>;

export const BluetoothDeviceList = ({
    variant,
    devices,
    onDeviceButtonPress,
}: BluetoothDeviceListProps) => {
    const { title, subtitle } = variantToTranslationsMap[variant];

    return (
        <VStack flex={1} justifyContent="space-between" spacing="sp32">
            <VStack marginTop="sp16" spacing="sp32">
                <TitleHeader
                    title={<Translation id={title} />}
                    subtitle={<Translation id={subtitle} />}
                    titleVariant="headline-md"
                    titleSpacing="sp12"
                />
                <VStack spacing="sp16">
                    {devices.map(device => (
                        <BluetoothDeviceCard
                            key={device.id}
                            variant={variant}
                            device={device}
                            onButtonPress={onDeviceButtonPress}
                        />
                    ))}
                </VStack>
            </VStack>
        </VStack>
    );
};
