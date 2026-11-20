import { VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { AboutUsBanners } from '../components/AboutUsBanners';
import { AppCommitHash } from '../components/AppCommitHash';
import { FaqCard } from '../components/FaqCard';
import { LegalSection } from '../components/LegalSection';
import { NeedHelpSection } from '../components/NeedHelpSection';

export const SettingsSupportScreen = () => (
    <Screen
        header={
            <DynamicScreenHeader
                title={<Translation id="moduleSettings.items.general.support.title" />}
            />
        }
    >
        <VStack spacing="sp32">
            <FaqCard />
            <NeedHelpSection />
            <AboutUsBanners />
            <LegalSection />
            <AppCommitHash />
        </VStack>
    </Screen>
);
