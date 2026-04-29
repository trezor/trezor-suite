import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { getEthereumStakingAddressByType } from '@suite-common/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import {
    asAmountSubunit,
    getStakingLimitsByNetworkSymbol,
    subunitsToUnits,
} from '@suite-common/wallet-utils';
import { AccountDetailsCard } from '@suite-native/accounts';
import { Box, Button, FullAlertBox, InlineAlertBox, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    type StackNavigationProps,
} from '@suite-native/navigation';
import {
    CLAIM_CALLDATA,
    type NativeStakingRootState,
    selectCanClaimByAccountKey,
    selectClaimableAmountByAccountKey,
} from '@suite-native/staking';
import { FeeSelector } from '@suite-native/transaction-management';
import { BigNumber } from '@trezor/utils';

import { useComposeEarnFees } from '../hooks/useComposeEarnFees';
import { buildEarnComposeFormState } from '../utils';

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
    const availableBalance = useSelector(
        (state: AccountsRootState) =>
            selectAccountByKey(state, accountKey)?.availableBalance ?? '0',
    );

    const feeBuffer = getStakingLimitsByNetworkSymbol(symbol)?.MIN_BALANCE_FOR_FEE_BUFFER;
    const availableBalanceInUnits = subunitsToUnits({
        value: asAmountSubunit(new BigNumber(availableBalance)),
        symbol,
    });
    const isInsufficientFeeBalance = !!feeBuffer && availableBalanceInUnits.lt(feeBuffer);
    const formattedAvailableBalance = `${availableBalanceInUnits.toString()} ${displaySymbol}`;

    const claimFormState = useMemo(
        () =>
            buildEarnComposeFormState(
                getEthereumStakingAddressByType(symbol, 'claim'),
                '0',
                CLAIM_CALLDATA,
            ),
        [symbol],
    );

    const { formDraft, formDraftKey, updateFeeLevelThunk } = useComposeEarnFees({
        accountKey,
        formState: claimFormState,
        formDraftPrefix: 'claim',
    });

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
                    <Button onPress={handleReviewAndSign} isDisabled={isInsufficientFeeBalance}>
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
                <FeeSelector
                    accountKey={accountKey}
                    updateThunk={updateFeeLevelThunk}
                    selectedFee={formDraft?.selectedFee ?? 'normal'}
                    selectedFeePerUnit={formDraft?.feePerUnit}
                    formDraft={formDraft}
                    formDraftKey={formDraftKey}
                />
                {isInsufficientFeeBalance && (
                    <FullAlertBox
                        variant="critical"
                        iconName="warningCircle"
                        title={
                            <Translation
                                id="earn.claimReviewScreen.insufficientFeeBalance.title"
                                values={{ displaySymbol }}
                            />
                        }
                        description={
                            <Translation
                                id="earn.claimReviewScreen.insufficientFeeBalance.description"
                                values={{ amount: formattedAvailableBalance }}
                            />
                        }
                    />
                )}
                {canClaimInstantly && !isInsufficientFeeBalance && (
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
