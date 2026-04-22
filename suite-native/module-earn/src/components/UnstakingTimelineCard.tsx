import { useSelector } from 'react-redux';

import { selectAccountNetworkSymbol, useAccountsSelector } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    BottomSheetModal,
    Card,
    HStack,
    InlineAlertBox,
    PressableOpacity,
    Text,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    type NativeStakingRootState,
    selectUnstakingPeriodInDaysBySymbol,
} from '@suite-native/staking';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { HowStakeWorksUnstakingTimeline } from './HowStakeWorksUnstakingTimeline';

type UnstakingTimelineCardProps = {
    accountKey: AccountKey;
};

const cardPressableStyle = prepareNativeStyle(() => ({
    width: '100%',
}));

const unstakingTimelineCardPaddingStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.sp4,
}));

export const UnstakingTimelineCard = ({ accountKey }: UnstakingTimelineCardProps) => {
    const { applyStyle } = useNativeStyles();
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    const symbol = useAccountsSelector(state => selectAccountNetworkSymbol(state, accountKey));

    const unstakingPeriodInDays = useSelector((state: NativeStakingRootState) =>
        selectUnstakingPeriodInDaysBySymbol(state, symbol ?? undefined),
    );

    if (!symbol) return null;

    return (
        <>
            <PressableOpacity style={applyStyle(cardPressableStyle)} onPress={openModal}>
                <Card
                    borderColor="borderNeutral"
                    noShadow
                    style={applyStyle(unstakingTimelineCardPaddingStyle)}
                >
                    <HStack alignItems="center" justifyContent="space-between" padding="sp16">
                        <Text variant="body-md-strong">
                            <Translation id="earn.earnFormScreen.unstakingTimeline" />
                        </Text>
                        <Icon name="caretDown" color="contentPrimary" />
                    </HStack>

                    {unstakingPeriodInDays !== undefined && (
                        <InlineAlertBox
                            variant="info"
                            title={
                                <Translation
                                    id="earn.earnFormScreen.unstakingPeriodInfo"
                                    values={{ days: unstakingPeriodInDays }}
                                />
                            }
                        />
                    )}
                </Card>
            </PressableOpacity>

            <BottomSheetModal
                ref={bottomSheetRef}
                title={<Translation id="earn.earnFormScreen.unstakingTimeline" />}
                isCloseDisplayed
                onClose={closeModal}
            >
                <HowStakeWorksUnstakingTimeline
                    symbol={symbol}
                    unstakingPeriodInDays={unstakingPeriodInDays}
                />
            </BottomSheetModal>
        </>
    );
};
