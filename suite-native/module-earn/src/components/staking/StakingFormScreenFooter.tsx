import { useNetworkStakingRate } from '@suite-common/earn-staking';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { Button } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';

import { EarnEstimatedRewards } from '../earn/EarnEstimatedRewards';
import { EarnScreenFooter } from '../earn/EarnScreenFooter';

type StakingFormScreenFooterProps = {
    symbol: NetworkSymbol;
    amountValue: string;
    isDisabled: boolean;
    onPress: () => void;
};

export const StakingFormScreenFooter = ({
    symbol,
    amountValue,
    isDisabled,
    onPress,
}: StakingFormScreenFooterProps) => {
    const { translate } = useTranslate();

    const { rate } = useNetworkStakingRate({ networkSymbol: symbol });

    const isRewardsBoxVisible = isApyAvailable(rate) && !!amountValue && !isDisabled;

    return (
        <EarnScreenFooter
            noHorizontalPadding
            estimatedRewards={
                isRewardsBoxVisible && (
                    <EarnEstimatedRewards
                        amountValue={amountValue}
                        apy={rate}
                        label={<Translation id="earn.earnFormScreen.estimatedRewardsLabel" />}
                        symbol={symbol}
                    />
                )
            }
        >
            <Button
                accessibilityRole="button"
                accessibilityLabel={translate('generic.validateForm')}
                onPress={onPress}
                isDisabled={isDisabled}
            >
                <Translation id="generic.buttons.continue" />
            </Button>
        </EarnScreenFooter>
    );
};
