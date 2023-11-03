import { Screen, ScreenSubHeader, ScreenHeader } from '@suite-native/navigation';
import { VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { DeviceManager } from '@suite-native/device-switcher';

import { FAQInfoPanel } from '../components/FAQInfoPanel';
import { SupportCard } from '../components/SupportCard';

export const SettingsFAQScreen = () => {
    const { translate } = useTranslate();

    return (
        <Screen
            screenHeader={
                <ScreenHeader>
                    <DeviceManager />
                </ScreenHeader>
            }
            subheader={<ScreenSubHeader content={translate('moduleSettings.faq.title')} />}
        >
            <VStack spacing="large">
                <FAQInfoPanel />
                <SupportCard />
            </VStack>
        </Screen>
    );
};
