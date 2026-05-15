import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import {
    Box,
    Card,
    HStack,
    PressableOpacity,
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    Screen,
    type StackNavigationProps,
    type YieldStackParamList,
    type YieldStackRoutes,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { YieldSupplyFlowFooter } from '../components/YieldSupplyFlowFooter';
import { YieldSupplyFlowScreenHeader } from '../components/YieldSupplyFlowScreenHeader';
import { YieldSupplyInfoBottomSheet } from '../components/YieldSupplyInfoBottomSheet';
import { YieldSupplyStepCard } from '../components/YieldSupplyStepCard';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { useYieldSession } from '../hooks/useYieldSession';

const inputShellStyle = prepareNativeStyle(utils => ({
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.elementBorderField,
    backgroundColor: utils.colors.legacyBackgroundTertiaryDefaultOnElevation0,
    borderRadius: utils.borders.radii.r12,
}));

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldSupply>;
type NavigationProps = StackNavigationProps<YieldStackParamList, YieldStackRoutes.YieldSupply>;

export const YieldSupplyScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const { applyStyle } = useNativeStyles();
    const {
        bottomSheetRef: infoBottomSheetRef,
        closeModal: closeInfoBottomSheet,
        openModal: openInfoBottomSheet,
    } = useBottomSheetModal();
    const { account, apy, flowKey, tokenSymbol, vault, vaultTokenName, resolutionStatus } =
        useResolvedYieldFlowData(route.params);
    useYieldSession({
        flowKey,
        flowType: 'deposit',
        shouldDisposeOnGoBack: true,
    });

    const handleEditApproval = () => {
        navigation.goBack();
    };

    if (resolutionStatus !== 'resolved') {
        return null;
    }

    return (
        <Screen
            noHorizontalPadding
            header={
                <YieldSupplyFlowScreenHeader
                    account={account}
                    onInfoPress={openInfoBottomSheet}
                    tokenContract={route.params.tokenContract}
                    vaultName={vault.metadata.name}
                />
            }
            footer={
                <YieldSupplyFlowFooter
                    amountValue={undefined}
                    apy={apy}
                    isDisabled
                    onPress={() => undefined}
                    tokenSymbol={tokenSymbol}
                />
            }
        >
            <VStack spacing="sp16">
                <YieldSupplyStepCard currentStepIndex={1} />

                <Box paddingHorizontal="sp16">
                    <Card>
                        <HStack alignItems="center" justifyContent="space-between">
                            <Text variant="body-sm">
                                <Translation id="earn.yieldSupplyFlowScreen.approvedAmount" />
                            </Text>
                            <HStack alignItems="center" spacing="sp8">
                                <Text variant="body-sm-strong" color="contentSecondary">
                                    <Translation id="earn.notAvailableShort" /> {tokenSymbol}
                                </Text>
                                <PressableOpacity
                                    accessibilityRole="button"
                                    accessibilityLabel="Edit approval amount"
                                    onPress={handleEditApproval}
                                >
                                    <Icon
                                        name="pencilSimple"
                                        size="mediumLarge"
                                        color="contentPrimary"
                                    />
                                </PressableOpacity>
                            </HStack>
                        </HStack>
                    </Card>
                </Box>

                <Box paddingHorizontal="sp16">
                    <Card>
                        <VStack spacing="sp12">
                            <HStack alignItems="center" justifyContent="space-between">
                                <Text variant="body-sm">
                                    <Translation id="earn.yieldSupplyFlowScreen.amountToSupply" />
                                </Text>
                                <Text variant="body-sm">
                                    <Translation id="earn.yieldSupplyFlowScreen.supplyMax" />
                                </Text>
                            </HStack>
                            <Box
                                paddingHorizontal="sp16"
                                paddingVertical="sp12"
                                style={applyStyle(inputShellStyle)}
                            >
                                <HStack alignItems="center" justifyContent="space-between">
                                    <Text variant="body-md" color="contentSecondary">
                                        <Translation id="earn.notAvailableShort" />
                                    </Text>
                                    <Text variant="body-md">{tokenSymbol}</Text>
                                </HStack>
                            </Box>
                        </VStack>
                    </Card>
                </Box>
            </VStack>

            <YieldSupplyInfoBottomSheet
                ref={infoBottomSheetRef}
                apy={apy}
                onClose={closeInfoBottomSheet}
                tokenSymbol={tokenSymbol}
                vaultTokenName={vaultTokenName}
            />
        </Screen>
    );
};
