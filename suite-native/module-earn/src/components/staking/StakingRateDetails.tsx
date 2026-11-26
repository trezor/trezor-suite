import { type ReactNode } from 'react';

import { type StakingRateKind } from '@suite-common/earn-staking-common';
import { type NetworkSymbol } from '@suite-common/networks';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { useBottomSheetModal } from '@suite-native/atoms';

import { StakingRateBreakdownBottomSheet } from './StakingRateBreakdownBottomSheet';
import { ApyDottedUnderline } from '../earn/ApyDottedUnderline';

type StakingRateDetailsProps = {
    children: ReactNode;
    networkSymbol: NetworkSymbol;
    rate: number | null;
    rateKind: StakingRateKind | null;
    isNestedSheet?: boolean;
};

export const StakingRateDetails = ({
    children,
    networkSymbol,
    rate,
    rateKind,
    isNestedSheet,
}: StakingRateDetailsProps) => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal({ isNestedSheet });

    if (rate === null || rateKind === null || !isApyAvailable(rate)) return children;

    return (
        <>
            <ApyDottedUnderline onPress={openModal}>{children}</ApyDottedUnderline>
            <StakingRateBreakdownBottomSheet
                ref={bottomSheetRef}
                onClose={closeModal}
                networkSymbol={networkSymbol}
                rate={rate}
                rateKind={rateKind}
            />
        </>
    );
};
