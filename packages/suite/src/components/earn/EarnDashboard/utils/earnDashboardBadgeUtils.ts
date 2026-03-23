import { type TranslationKey } from '@suite/intl';
import { type BadgeIntent } from '@trezor/components';

type EarnDashboardBadgeState = {
    intent: BadgeIntent;
    labelId: TranslationKey;
};

type GetEarnDashboardBadgeStateParams = {
    isSectionActive: boolean;
    activeLabelId: TranslationKey;
    notActiveLabelId: TranslationKey;
    isSectionOutdated?: boolean;
    outdatedLabelId?: TranslationKey;
};

export const getEarnDashboardBadgeState = ({
    isSectionActive,
    activeLabelId,
    notActiveLabelId,
    isSectionOutdated,
    outdatedLabelId,
}: GetEarnDashboardBadgeStateParams): EarnDashboardBadgeState => {
    if (!isSectionActive) {
        return {
            intent: 'neutral',
            labelId: notActiveLabelId,
        };
    }

    if (isSectionOutdated && outdatedLabelId) {
        return {
            intent: 'warning',
            labelId: outdatedLabelId,
        };
    }

    return {
        intent: 'brand',
        labelId: activeLabelId,
    };
};
