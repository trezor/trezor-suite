import { type ReactNode, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
    Extrapolation,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';

import { type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { type BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';
import {
    BottomSheetModal,
    type BottomSheetModalRef,
    Box,
    Card,
    CircularSpinner,
    HStack,
    IconButton,
    Text,
    VStack,
} from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';
import {
    CryptoToFiatAmountFormatter,
    ExactCryptoAmountFormatter,
    TransactionIdFormatter,
} from '@suite-native/formatters';
import { Icon, NetworkIcon, TokenIcon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { YieldPendingTransactionModalBackdrop } from './YieldPendingTransactionModalBackdrop';
import { modalSnap } from './YieldPendingTransactionModalConstants';
import { YieldPendingTransactionModalHeader } from './YieldPendingTransactionModalHeader';
import { YieldPendingTransactionModalRow } from './YieldPendingTransactionModalRow';

type YieldPendingTransactionModalProps = {
    accountLabel: string;
    accountSymbol: NetworkSymbol;
    amount?: ReactNode;
    amountLabel?: ReactNode;
    amountTokenContract?: TokenAddress;
    amountTokenSymbol?: TokenSymbol;
    fee?: string;
    isExploreDisabled?: boolean;
    onDismiss?: () => void;
    onExplorePress: () => void;
    ref: BottomSheetModalRef;
    submittedAt: Date;
    title: ReactNode;
    txid: string;
    vaultName?: string;
    vaultTokenContract?: TokenAddress;
};

const pendingIconStyle = prepareNativeStyle(utils => ({
    width: 56,
    height: 56,
    borderRadius: utils.borders.radii.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: utils.colors.surfaceFillRaised,
    ...utils.boxShadows.small,
}));

const valueStyle = prepareNativeStyle(() => ({
    minWidth: 0,
    flexShrink: 1,
}));

const roundNetworkIconStyle = prepareNativeStyle(utils => ({
    borderRadius: utils.borders.radii.round,
    overflow: 'hidden',
}));

const getBottomSheet = (ref: BottomSheetModalRef): BottomSheetModalMethods | null => {
    if (typeof ref === 'object' && ref !== null && 'current' in ref) {
        return ref.current;
    }

    return null;
};

export const YieldPendingTransactionModalContainer = ({ children }: { children?: ReactNode }) => (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        {children}
    </View>
);

export const YieldPendingTransactionModal = ({
    accountLabel,
    accountSymbol,
    amount,
    amountLabel,
    amountTokenContract,
    amountTokenSymbol,
    fee,
    isExploreDisabled,
    onDismiss,
    onExplorePress,
    ref,
    submittedAt,
    title,
    txid,
    vaultName,
    vaultTokenContract,
}: YieldPendingTransactionModalProps) => {
    const { applyStyle } = useNativeStyles();
    const { DateFormatter, TimeFormatter } = useFormatters();
    const { translate } = useTranslate();
    const copyToClipboard = useCopyToClipboard();
    const animatedIndex = useSharedValue<number>(modalSnap.expandedIndex);
    const snapPoints = useMemo(() => [modalSnap.collapsedHeight], []);
    const caretAnimatedStyle = useAnimatedStyle(() => {
        const rotation = interpolate(
            animatedIndex.value,
            [modalSnap.collapsedIndex, modalSnap.expandedIndex],
            [180, 0],
            Extrapolation.CLAMP,
        );

        return {
            transform: [{ rotateZ: `${rotation}deg` }],
        };
    });

    const handleToggleSheet = useCallback(() => {
        const isExpanded = animatedIndex.value >= modalSnap.indexMidpoint;
        const bottomSheet = getBottomSheet(ref);

        if (isExpanded) {
            bottomSheet?.collapse();
        } else {
            bottomSheet?.expand();
        }
    }, [animatedIndex, ref]);

    const renderBackdrop = useCallback(
        (props: BottomSheetBackdropProps) => <YieldPendingTransactionModalBackdrop {...props} />,
        [],
    );

    const handleCopyTxid = useCallback(
        () =>
            copyToClipboard(
                txid,
                translate(
                    'transactions.TransactionDetailScreen.parametersSheet.transactionIdCopied',
                ),
            ),
        [copyToClipboard, translate, txid],
    );

    return (
        <BottomSheetModal
            ref={ref}
            onDismiss={onDismiss}
            bottomSheetCustomProps={{
                backdropComponent: renderBackdrop,
                enableDynamicSizing: true,
                enablePanDownToClose: false,
                handleComponent: () => (
                    <YieldPendingTransactionModalHeader
                        caretAnimatedStyle={caretAnimatedStyle}
                        onToggleSheet={handleToggleSheet}
                        title={title}
                    />
                ),
                index: modalSnap.expandedIndex,
                animatedIndex,
                containerComponent: YieldPendingTransactionModalContainer,
                snapPoints,
            }}
        >
            <VStack spacing="sp16" paddingBottom="sp16">
                <Box alignItems="center">
                    <Box style={applyStyle(pendingIconStyle)}>
                        <CircularSpinner size={56} color="elementFillWarningBold" width={2} />
                        <Icon name="arrowUp" color="contentPrimary" size="large" />
                    </Box>
                </Box>

                <Card noPadding>
                    <YieldPendingTransactionModalRow
                        noBorder
                        label={<Translation id="moduleTrading.tradingConfirmationScreen.date" />}
                    >
                        <HStack spacing="sp2" alignItems="center">
                            <Text variant="body-sm" color="contentPrimary">
                                <DateFormatter value={submittedAt} />
                            </Text>
                            <Text variant="body-sm" color="contentPrimary">
                                ,
                            </Text>
                            <Text variant="body-sm" color="contentPrimary">
                                <TimeFormatter value={submittedAt} />
                            </Text>
                        </HStack>
                    </YieldPendingTransactionModalRow>

                    <YieldPendingTransactionModalRow
                        label={<Translation id="moduleTrading.exchangeTradePreviewCard.account" />}
                    >
                        <HStack spacing="sp8" alignItems="center">
                            <NetworkIcon symbol={accountSymbol} size={20} />
                            <Text variant="body-sm" color="contentPrimary">
                                {accountLabel}
                            </Text>
                        </HStack>
                    </YieldPendingTransactionModalRow>

                    {vaultName && (
                        <YieldPendingTransactionModalRow
                            label={
                                <Translation id="moduleAccounts.accountDetail.stablecoinYield.vault" />
                            }
                        >
                            <HStack
                                spacing="sp4"
                                alignItems="center"
                                style={applyStyle(valueStyle)}
                            >
                                <TokenIcon
                                    symbol={accountSymbol}
                                    contractAddress={vaultTokenContract}
                                    size="extraSmall"
                                    wrappedTokenIcon="network"
                                />
                                <Text
                                    variant="body-sm"
                                    color="contentPrimary"
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                    style={applyStyle(valueStyle)}
                                >
                                    {vaultName}
                                </Text>
                            </HStack>
                        </YieldPendingTransactionModalRow>
                    )}

                    {amount && amountLabel && (
                        <YieldPendingTransactionModalRow label={amountLabel}>
                            {amountTokenSymbol ? (
                                <HStack
                                    spacing="sp4"
                                    alignItems="center"
                                    style={applyStyle(valueStyle)}
                                >
                                    <TokenIcon
                                        symbol={accountSymbol}
                                        contractAddress={amountTokenContract}
                                        size="extraSmall"
                                    />
                                    <Text
                                        variant="body-sm"
                                        color="contentPrimary"
                                        numberOfLines={1}
                                        ellipsizeMode="tail"
                                        style={applyStyle(valueStyle)}
                                    >
                                        {amount} {amountTokenSymbol}
                                    </Text>
                                </HStack>
                            ) : (
                                <HStack
                                    spacing="sp4"
                                    alignItems="center"
                                    style={applyStyle(valueStyle)}
                                >
                                    <Box style={applyStyle(roundNetworkIconStyle)}>
                                        <NetworkIcon symbol={accountSymbol} size={20} />
                                    </Box>
                                    <Text variant="body-sm" color="contentPrimary">
                                        {amount}
                                    </Text>
                                </HStack>
                            )}
                        </YieldPendingTransactionModalRow>
                    )}

                    <YieldPendingTransactionModalRow
                        label={
                            <Translation id="transactionManagement.fees.description.title.ethereum" />
                        }
                    >
                        {fee ? (
                            <VStack alignItems="flex-end" spacing="sp2">
                                <ExactCryptoAmountFormatter
                                    value={fee}
                                    symbol={accountSymbol}
                                    color="contentPrimary"
                                    isBalance={false}
                                    isDiscreetText={false}
                                />
                                <CryptoToFiatAmountFormatter
                                    value={fee}
                                    symbol={accountSymbol}
                                    color="contentSecondary"
                                    isDiscreetText={false}
                                    textAlign="right"
                                />
                            </VStack>
                        ) : (
                            <Text variant="body-sm" color="contentPrimary">
                                <Translation id="earn.notAvailableShort" />
                            </Text>
                        )}
                    </YieldPendingTransactionModalRow>

                    <YieldPendingTransactionModalRow
                        label={
                            <Translation id="moduleTrading.tradingConfirmationScreen.transactionId" />
                        }
                    >
                        <HStack spacing="sp4" alignItems="center" style={applyStyle(valueStyle)}>
                            <TransactionIdFormatter
                                value={txid}
                                color="contentPrimary"
                                style={applyStyle(valueStyle)}
                            />
                            <IconButton
                                iconName="copy"
                                onPress={handleCopyTxid}
                                intent="neutral"
                                priority="secondary"
                                size="small"
                                accessibilityLabel={translate(
                                    'transactions.TransactionDetailScreen.parametersSheet.transactionId',
                                )}
                            />
                            <IconButton
                                iconName="arrowUpRight"
                                onPress={onExplorePress}
                                isDisabled={isExploreDisabled}
                                intent="neutral"
                                priority="secondary"
                                size="small"
                                accessibilityLabel={translate(
                                    'moduleTrading.tradingConfirmationScreen.exploreInBlockchain',
                                )}
                            />
                        </HStack>
                    </YieldPendingTransactionModalRow>
                </Card>
            </VStack>
        </BottomSheetModal>
    );
};
