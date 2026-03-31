import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { AccountDetailsCard } from '@suite-native/accounts';
import { Box, Button, InlineAlertBox, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    type StackNavigationProps,
} from '@suite-native/navigation';
import {
    type NativeStakingRootState,
    selectCanClaimByAccountKey,
    selectClaimableAmountByAccountKey,
} from '@suite-native/staking';

export const ClaimReviewScreen = () => {
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.ClaimReview>>();
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.ClaimReview>>();
    const { accountKey, symbol } = route.params;
    const displaySymbol = getNetworkDisplaySymbol(symbol);

    const canClaimInstantly = useSelector((state: NativeStakingRootState) =>
        selectCanClaimByAccountKey(state, accountKey),
    );
    const claimableAmount = useSelector((state: NativeStakingRootState) =>
        selectClaimableAmountByAccountKey(state, accountKey),
    );

    const handleReviewAndSign = () => {
        navigation.navigate(RootStackRoutes.ClaimTransactionDataReview, { accountKey });
    };

    return (
        <Screen
            header={
                <ScreenHeader
                    closeActionType="back"
                    customContent={
                        <Text variant="body-md-strong">
                            <Translation
                                id="earn.claimReviewScreen.title"
                                values={{ displaySymbol }}
                            />
                        </Text>
                    }
                />
            }
            footer={
                <Box paddingHorizontal="sp16" paddingBottom="sp16">
                    <Button onPress={handleReviewAndSign}>
                        <Translation id="earn.claimReviewScreen.reviewAndSignButton" />
                    </Button>
                </Box>
            }
        >
            <VStack spacing="sp16">
                <AccountDetailsCard
                    accountKey={accountKey}
                    isStakeVariant={true}
                    titleLabel={<Translation id="earn.claimReviewScreen.amountLabel" />}
                    cryptoAmount={claimableAmount}
                />
                {canClaimInstantly && (
                    <InlineAlertBox
                        variant="success"
                        title={
                            <Translation
                                id="earn.claimReviewScreen.instantClaimBanner"
                                values={{ displaySymbol }}
                            />
                        }
                    />
                )}
            </VStack>
        </Screen>
    );
};
