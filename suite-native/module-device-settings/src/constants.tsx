import { type CardStepperMap } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const wipeDeviceStepToContentMap = {
    1: {
        header: (
            <Translation id="moduleDeviceSettings.wipeDevice.confirmationCards.eraseAllData.title" />
        ),
        description: (
            <Translation id="moduleDeviceSettings.wipeDevice.confirmationCards.eraseAllData.description" />
        ),
        icon: 'trash',
    },
    2: {
        header: (
            <Translation id="moduleDeviceSettings.wipeDevice.confirmationCards.walletBackup.title" />
        ),
        description: (
            <Translation id="moduleDeviceSettings.wipeDevice.confirmationCards.walletBackup.description" />
        ),
        icon: 'newspaper',
    },
} as const satisfies CardStepperMap;
