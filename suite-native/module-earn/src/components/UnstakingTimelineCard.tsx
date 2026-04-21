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
    TimelineDetailsCard,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    type NativeStakingRootState,
    selectUnstakingPeriodInDaysBySymbol,
} from '@suite-native/staking';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

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
                <TimelineDetailsCard
                    headerTitle={<Translation id="earn.howStakeWorksScreen.unstakeTimelineTitle" />}
                    headerIconName="arrowDownLeft"
                    items={[
                        {
                            id: 'unstake.first',
                            title: (
                                <Translation id="earn.howStakeWorksScreen.unstakeTimeline.first.title" />
                            ),
                            description: (
                                <Translation id="earn.howStakeWorksScreen.unstakeTimeline.first.description" />
                            ),
                        },
                        {
                            id: 'unstake.second',
                            title: (
                                <Translation id="earn.howStakeWorksScreen.unstakeTimeline.second.title" />
                            ),
                            description:
                                unstakingPeriodInDays !== undefined ? (
                                    <Translation
                                        id="earn.howStakeWorksScreen.unstakeTimeline.second.description"
                                        values={{ unstakingPeriod: unstakingPeriodInDays }}
                                    />
                                ) : (
                                    <Translation id="earn.notAvailable" />
                                ),
                        },
                        {
                            id: 'unstake.third',
                            title: (
                                <Translation
                                    id="earn.howStakeWorksScreen.unstakeTimeline.third.title"
                                    values={{ symbol: symbol.toUpperCase() }}
                                />
                            ),
                            description: (
                                <Translation id="earn.howStakeWorksScreen.unstakeTimeline.third.description" />
                            ),
                        },
                        {
                            id: 'unstake.fourth',
                            title: (
                                <Translation
                                    id="earn.howStakeWorksScreen.unstakeTimeline.fourth.title"
                                    values={{ symbol: symbol.toUpperCase() }}
                                />
                            ),
                            description: (
                                <Translation id="earn.howStakeWorksScreen.unstakeTimeline.fourth.description" />
                            ),
                        },
                    ]}
                />
            </BottomSheetModal>
        </>
    );
};
