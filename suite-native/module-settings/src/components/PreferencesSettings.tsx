import { Translation } from '@suite-native/intl';
import { SettingsStackRoutes } from '@suite-native/navigation';
import { SettingsSection, SettingsSectionItem } from '@suite-native/settings';
import { useExperiment, Experiment } from '@suite-common/message-system';

import { useSettingsNavigateTo } from '../navigation/useSettingsNavigateTo';

const getSectionTitle = (activeExperimentVariant?: {
    variant: string;
    [k: string]: unknown;
    percentage: number;
}) => {
    switch (activeExperimentVariant?.variant) {
        case 'Base':
            return `Čau Štěpáne ${activeExperimentVariant.inclusion}%`;
        case 'Custom':
            return `Čau Stew ${activeExperimentVariant.inclusion}%`;
        default:
            return <Translation id="moduleSettings.items.preferences.title" />;
    }
};

const getItemTitle = (activeExperimentVariant?: {
    variant: string;
    [k: string]: unknown;
    percentage: number;
}) => {
    switch (activeExperimentVariant?.variant) {
        case 'Base':
            return `POL base ${activeExperimentVariant.inclusion}%`;
        case 'Custom':
            return `POL custom ${activeExperimentVariant.inclusion}%`;
        default:
            return <Translation id="moduleSettings.items.preferences.localization.title" />;
    }
};

const getNextItemTitle = (activeExperimentVariant?: {
    variant: string;
    [k: string]: unknown;
    percentage: number;
}) => {
    switch (activeExperimentVariant?.variant) {
        case 'Base':
            return `BNB base ${activeExperimentVariant.inclusion}%`;
        case 'Custom':
            return `BNB custom ${activeExperimentVariant.inclusion}%`;
        default:
            return <Translation id="moduleSettings.items.preferences.customization.title" />;
    }
};

export const PreferencesSettings = () => {
    const navigateTo = useSettingsNavigateTo();
    const { activeExperimentVariant } = useExperiment(Experiment.hellowEthWorld);
    const { activeExperimentVariant: activeExperimentVarianPol } = useExperiment(
        Experiment.hellowPolWorld,
    );
    const { activeExperimentVariant: activeExperimentVarianBNB } = useExperiment(
        Experiment.hellowBNBWorld,
    );

    return (
        <SettingsSection title={getSectionTitle(activeExperimentVariant)}>
            <SettingsSectionItem
                iconName="flag"
                title={getItemTitle(activeExperimentVarianPol)}
                subtitle={
                    <Translation id="moduleSettings.items.preferences.localization.subtitle" />
                }
                onPress={() => navigateTo(SettingsStackRoutes.SettingsLocalization)}
                testID="@settings/localization"
            />
            <SettingsSectionItem
                iconName="palette"
                title={getNextItemTitle(activeExperimentVarianBNB)}
                subtitle={
                    <Translation id="moduleSettings.items.preferences.customization.subtitle" />
                }
                onPress={() => navigateTo(SettingsStackRoutes.SettingsCustomization)}
                testID="@settings/customization"
            />
        </SettingsSection>
    );
};
