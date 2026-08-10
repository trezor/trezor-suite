import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { isWrappedNativeToken } from '@suite-common/wallet-utils';
import {
    BottomSheetModal,
    type BottomSheetModalRef,
    Box,
    Button,
    Text,
    TimelineDetailsCard,
    VStack,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { useApyBreakdownAlert } from '../hooks/useApyBreakdownAlert';
import { HowEarnWorksBenefitsSection } from './HowEarnWorks/HowEarnWorksBenefitsSection';
import { HowEarnWorksTimelineCard } from './HowEarnWorks/HowEarnWorksTimelineCard';
import { useHowYieldWorksPreset } from '../presets/HowEarnWorks/yieldPresets';

type YieldDepositInfoBottomSheetProps = {
    apy: number | null;
    bonusRewardTokenSymbol?: string | null;
    onClose: () => void;
    ref: BottomSheetModalRef;
    tokenSymbol: string;
    vaultTokenSymbol: string;
    account: Account;
    vault: YieldDtoV2;
    wrappedNativeSymbol: string | null;
};

export const YieldDepositInfoBottomSheet = ({
    apy,
    bonusRewardTokenSymbol,
    onClose,
    ref,
    tokenSymbol,
    vaultTokenSymbol,
    account,
    vault,
    wrappedNativeSymbol,
}: YieldDepositInfoBottomSheetProps) => {
    const apyBreakdownAlert = useApyBreakdownAlert({ account, vault });

    const isWrappedNativeVault =
        !!vault && !!account && isWrappedNativeToken(account.symbol, vault.token.address);
    const nativeSymbol = account ? getNetworkDisplaySymbol(account.symbol) : null;

    const { benefitItems, timelineSections } = useHowYieldWorksPreset({
        apy,
        onApyPress: apyBreakdownAlert.onPress,
        bonusRewardTokenSymbol,
        tokenSymbol,
        vaultTokenSymbol,
        wrappedNativeSymbol,
    });

    return (
        <BottomSheetModal
            ref={ref}
            title={
                <Translation
                    id={
                        isWrappedNativeVault
                            ? 'earn.howYieldWorksScreen.wrappedNativeVault.defiYieldTitle'
                            : 'earn.howYieldWorksScreen.defiYieldTitle'
                    }
                    values={{ nativeSymbol }}
                />
            }
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
                    <Translation
                        id={
                            isWrappedNativeVault
                                ? 'earn.howYieldWorksScreen.wrappedNativeVault.defiYieldSubtitle'
                                : 'earn.howYieldWorksScreen.defiYieldSubtitle'
                        }
                        values={{ nativeSymbol }}
                    />
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
