import { type AccountKey } from '@suite-common/wallet-types';
import { FullAlertBox } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';

import { useInstantUnstakeBanner } from '../hooks/useInstantUnstakeBanner';

type InstantUnstakeConfirmationBannerProps = {
    accountKey: AccountKey;
};

export const InstantUnstakeConfirmationBanner = ({
    accountKey,
}: InstantUnstakeConfirmationBannerProps) => {
    const { translate } = useTranslate();
    const data = useInstantUnstakeBanner(accountKey);

    if (!data) return null;

    const { amount, displaySymbol, unstakingPeriodInDays, dismiss } = data;
    const hasDays = unstakingPeriodInDays !== undefined && unstakingPeriodInDays > 0;

    const description = hasDays ? (
        <Translation
            id="earn.stakingManagementScreen.instantUnstakeBanner.descriptionWithDays"
            values={{
                amount,
                symbol: displaySymbol,
                days: unstakingPeriodInDays,
            }}
        />
    ) : (
        <Translation
            id="earn.stakingManagementScreen.instantUnstakeBanner.descriptionWithoutDays"
            values={{ amount, symbol: displaySymbol }}
        />
    );

    return (
        <FullAlertBox
            testID="@staking/instant-unstake-banner"
            variant="neutral"
            iconName="lightning"
            title={
                <Translation
                    id="earn.stakingManagementScreen.instantUnstakeBanner.title"
                    values={{ amount, symbol: displaySymbol }}
                />
            }
            description={description}
            primaryButtonLabel={translate('generic.buttons.gotIt')}
            onPressPrimaryButton={dismiss}
            primaryButtonProps={{ testID: '@staking/instant-unstake-banner/got-it-button' }}
        />
    );
};
