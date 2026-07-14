import { useCallback } from 'react';

import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { type Account } from '@suite-common/wallet-types';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { useAlert } from '@suite-native/alerts';
import {
    BottomSheetModal,
    type BottomSheetModalRef,
    Box,
    Button,
    Text,
    TimelineDetailsCard,
    VStack,
} from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';

import { HowEarnWorksBenefitsSection } from './HowEarnWorks/HowEarnWorksBenefitsSection';
import { HowEarnWorksTimelineCard } from './HowEarnWorks/HowEarnWorksTimelineCard';
import { StablecoinYieldApyBreakdown } from './StablecoinYieldApyBreakdown';
import { createHowYieldWorksPreset } from '../presets/HowEarnWorks/yieldPresets';

type YieldDepositInfoBottomSheetProps = {
    apy: number | null;
    bonusRewardTokenName?: string | null;
    onClose: () => void;
    ref: BottomSheetModalRef;
    tokenSymbol: string;
    vaultTokenSymbol: string;
    account: Account;
    vault: YieldDtoV2;
};

export const YieldDepositInfoBottomSheet = ({
    apy,
    bonusRewardTokenName,
    onClose,
    ref,
    tokenSymbol,
    vaultTokenSymbol,
    account,
    vault,
}: YieldDepositInfoBottomSheetProps) => {
    const { showAlert } = useAlert();
    const { translate } = useTranslate();

    const apyValueText = apy && isApyAvailable(apy) ? `~${apy.toFixed(2)}%` : null;

    const onApyPress = useCallback(() => {
        if (!account || !vault) {
            return;
        }

        showAlert({
            title: vault.outputToken?.name ?? '',
            description: translate(
                'moduleAccounts.accountDetail.stablecoinYield.apyBreakdown.apyLabel',
                { apy: apyValueText },
            ),
            appendix: (
                <StablecoinYieldApyBreakdown
                    networkSymbol={account.symbol}
                    rewards={vault.rewardRate.components}
                    underlyingToken={vault.token}
                    tokenSymbol={vault.token.symbol}
                />
            ),
            textAlign: 'center',
            titleSpacing: 'sp4',
            primaryButtonTitle: translate('generic.buttons.close'),
            testID: '@account-detail/stablecoin-yield/apy-breakdown-alert',
        });
    }, [account, apyValueText, showAlert, translate, vault]);

    const { benefitItems, timelineSections } = createHowYieldWorksPreset({
        apy,
        onApyPress,
        bonusRewardTokenName,
        tokenSymbol,
        vaultTokenSymbol,
    });

    return (
        <BottomSheetModal
            ref={ref}
            title={<Translation id="earn.howYieldWorksScreen.title" />}
            isCloseDisplayed
            onClose={onClose}
            footer={
                <Box paddingHorizontal="sp24" paddingBottom="sp16">
                    <Button onPress={onClose}>
                        <Translation id="generic.buttons.gotIt" />
                    </Button>
                </Box>
            }
        >
            <VStack spacing="sp32">
                <Text variant="body-sm" color="contentSecondary">
                    <Translation id="earn.howYieldWorksScreen.subtitle" />
                </Text>
                <HowEarnWorksBenefitsSection items={benefitItems} />
                <HowEarnWorksTimelineCard
                    cardTitle={<Translation id="earn.howYieldWorksScreen.timelineCardTitle" />}
                    bottomSheetTitle={
                        <Translation id="earn.howYieldWorksScreen.timelineBottomSheetTitle" />
                    }
                >
                    <VStack spacing="sp24">
                        {timelineSections.map(section => (
                            <TimelineDetailsCard
                                key={section.id}
                                headerTitle={section.title}
                                headerIconName={section.iconName}
                                items={section.items}
                            />
                        ))}
                    </VStack>
                </HowEarnWorksTimelineCard>
            </VStack>
        </BottomSheetModal>
    );
};
