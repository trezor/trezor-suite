import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type StakeRootState, selectApy } from '@suite-common/wallet-core';
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

    const apy = useSelector((state: StakeRootState) => selectApy(state, { networkSymbol: symbol }));

    const isRewardsBoxVisible = isApyAvailable(apy) && !!amountValue && !isDisabled;

    return (
        <EarnScreenFooter
            estimatedRewards={
                isRewardsBoxVisible && (
                    <EarnEstimatedRewards
                        amountValue={amountValue}
                        apy={apy}
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
