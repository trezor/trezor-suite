import { useSelector } from 'react-redux';

import { Translation } from '@suite-native/intl';
import {
    selectIsTradingCountrySet,
    selectIsTradingResidenceCheckEnabled,
} from '@suite-native/trading-state';

import { AppSettingsCardWithIconLayout } from './AppSettingsCardWithIconLayout';

export type TradingSettingsCardProps = {
    onPress: () => void;
    testID?: string;
};

export const TradingSettingsCard = (props: TradingSettingsCardProps) => {
    const shouldDisplayTradingSettings = useSelector(selectIsTradingResidenceCheckEnabled);
    const isTradingCountrySet = useSelector(selectIsTradingCountrySet);

    if (!shouldDisplayTradingSettings) {
        return null;
    }

    if (isTradingCountrySet) {
        return (
            <AppSettingsCardWithIconLayout
                title={<Translation id="moduleSettings.items.general.trading.title" />}
                subtitle={<Translation id="moduleSettings.items.general.trading.subtitle" />}
                icon="arrowsLeftRight"
                variant="normal"
                {...props}
            />
        );
    }

    return (
        <AppSettingsCardWithIconLayout
            title={<Translation id="moduleSettings.items.general.trading.titleInactive" />}
            subtitle={<Translation id="moduleSettings.items.general.trading.subtitleInactive" />}
            icon="arrowsLeftRight"
            variant="primary"
            {...props}
        />
    );
};
