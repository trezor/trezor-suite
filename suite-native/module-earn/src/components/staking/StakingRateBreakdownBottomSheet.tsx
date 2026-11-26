import { type StakingRateKind } from '@suite-common/earn-staking-common';
import { type NetworkSymbol } from '@suite-common/networks';
import { AssetSymbol } from '@suite-native/assets';
import { type BottomSheetModalRef } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { ApyValue } from '../earn/ApyValue';
import { EarnRateBreakdownBottomSheet } from '../earn/EarnRateBreakdownBottomSheet';
import { EarnRateBreakdownRow } from '../earn/EarnRateBreakdownRow';

type StakingRateBreakdownBottomSheetProps = {
    ref: BottomSheetModalRef;
    onClose: () => void;
    networkSymbol: NetworkSymbol;
    rate: number;
    rateKind: StakingRateKind;
};

export const StakingRateBreakdownBottomSheet = ({
    ref,
    onClose,
    networkSymbol,
    rate,
    rateKind,
}: StakingRateBreakdownBottomSheetProps) => {
    const isApr = rateKind === 'apr';

    return (
        <EarnRateBreakdownBottomSheet
            ref={ref}
            onClose={onClose}
            title={
                <Translation
                    id={isApr ? 'earn.stakingRate.aprTitle' : 'earn.stakingRate.apyTitle'}
                />
            }
            footer={
                <Translation
                    id={
                        isApr
                            ? 'earn.stakingRate.aprFooter'
                            : 'moduleAccounts.accountDetail.stablecoinYield.apyBreakdown.footerApy'
                    }
                />
            }
        >
            <EarnRateBreakdownRow
                icon={
                    <TokenIcon
                        networkSymbol={networkSymbol}
                        tokenSymbol={networkSymbol}
                        size="extraSmall"
                    />
                }
                symbol={<AssetSymbol networkSymbol={networkSymbol} />}
                description={
                    <Translation
                        id={
                            isApr
                                ? 'earn.stakingRate.aprDescription'
                                : 'earn.stakingRate.apyDescription'
                        }
                    />
                }
                value={<ApyValue apy={rate} withLabel rateType={rateKind} />}
            />
        </EarnRateBreakdownBottomSheet>
    );
};
