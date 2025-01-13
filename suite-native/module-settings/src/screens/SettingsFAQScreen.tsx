import { Screen, ScreenHeader } from '@suite-native/navigation';
import { VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { FAQInfoPanel } from '../components/FAQInfoPanel';
import { SupportCard } from '../components/SupportCard';

export const SettingsFAQScreen = () => {
    const { translate } = useTranslate();

    return (
        <Screen header={<ScreenHeader content={translate('moduleSettings.faq.title')} />}>
            <VStack spacing="sp24">
                <FAQInfoPanel />
                <SupportCard />
            </VStack>
        </Screen>
    );
};
