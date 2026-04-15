import { useSelector } from 'react-redux';

import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Card, Divider } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { EarnAmountInputs } from './EarnAmountInputs';
import { type EarnMaxButtonVariant } from './EarnMaxButton';
import { InstantlyAvailableRow } from './InstantlyAvailableRow';

type EarnOutputFieldsProps = {
    accountKey: AccountKey;
    maxButtonVariant?: EarnMaxButtonVariant;
    isWithdrawalFeesBannerVisible?: boolean;
    unstakeInstantAmount?: string | null;
};

const cardStyle = prepareNativeStyle(utils => ({
    borderColor: utils.colors.borderNeutral,
    borderWidth: utils.borders.widths.small,
}));

const fullWidthDividerStyle = prepareNativeStyle(utils => ({
    marginHorizontal: -utils.spacings.sp16,
}));

export const EarnOutputFields = ({
    accountKey,
    maxButtonVariant,
    isWithdrawalFeesBannerVisible,
    unstakeInstantAmount,
}: EarnOutputFieldsProps) => {
    const { applyStyle } = useNativeStyles();
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    if (!symbol) return null;

    return (
        <Card style={applyStyle(cardStyle)}>
            <EarnAmountInputs
                accountKey={accountKey}
                symbol={symbol}
                maxButtonVariant={maxButtonVariant}
                isWithdrawalFeesBannerVisible={isWithdrawalFeesBannerVisible}
            />
            {unstakeInstantAmount && (
                <>
                    <Divider marginVertical="sp20" style={applyStyle(fullWidthDividerStyle)} />
                    <InstantlyAvailableRow
                        accountKey={accountKey}
                        approximatedAmount={unstakeInstantAmount}
                    />
                </>
            )}
        </Card>
    );
};
