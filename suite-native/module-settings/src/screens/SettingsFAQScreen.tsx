import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Screen, ScreenSubHeader } from '@suite-native/navigation';
import { VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { FAQInfoPanel } from '../components/FAQInfoPanel';
import { SupportCard } from '../components/SupportCard';

export const SettingsFAQScreen = () => {
    const { translate } = useTranslate();

    return (
        <Screen
            screenHeader={<DeviceManagerScreenHeader />}
            subheader={<ScreenSubHeader content={translate('moduleSettings.faq.title')} />}
        >
            <VStack spacing="large">
                <FAQInfoPanel />
                <SupportCard />
            </VStack>
        </Screen>
    );
};
