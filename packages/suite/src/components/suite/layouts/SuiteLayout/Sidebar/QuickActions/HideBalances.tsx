import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { useTranslation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { useDiscreetMode } from '@suite-common/discreet-mode';
import { QuickActionButton } from '@trezor/product-components';

export const HideBalances = () => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const { translationString } = useTranslation();
    const { isDiscreetMode, setIsDiscreetMode } = useDiscreetMode();
    const translationLabel = isDiscreetMode ? 'TR_SHOW_BALANCES' : 'TR_HIDE_BALANCES';

    const handleDiscreetModeClick = () => {
        const newValue = !isDiscreetMode;
        setIsDiscreetMode(newValue);
        analytics.report({
            type: events.menuToggleDiscreetEvent.name,
            payload: { value: newValue },
        });
    };

    return (
        <QuickActionButton
            tooltip={{ content: translationString(translationLabel) }}
            onClick={handleDiscreetModeClick}
            data-testid="@quickActions/hideBalances"
            iconName={isDiscreetMode ? 'eyeSlash' : 'eye'}
        />
    );
};
