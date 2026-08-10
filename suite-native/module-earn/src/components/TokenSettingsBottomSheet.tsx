import { type ReactNode, type Ref, forwardRef } from 'react';
import { View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { type BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { useNavigation } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { selectIsPortfolioTrackerDevice } from '@suite-common/device';
import {
    DefinitionType,
    type TokenDefinitionsRootState,
    TokenManagementAction,
    tokenDefinitionsActions,
} from '@suite-common/token-definitions';
import { getDisplaySymbol, getNetwork } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type TokensRootState,
    selectAccountByKey,
    selectAccountHiddenTokens,
    selectAccountNetworkSymbol,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress, toTokenSymbol } from '@suite-common/wallet-types';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import {
    BottomSheetModal,
    Box,
    Button,
    Card,
    CardDivider,
    HStack,
    Text,
    TouchableSwitchRow,
    VStack,
} from '@suite-native/atoms';
import { isDevelopOrDebugEnv } from '@suite-native/config';
import {
    AddressFormatter,
    CoinToFiatAmountFormatter,
    TokenAmountFormatter,
    TokenToFiatAmountFormatter,
} from '@suite-native/formatters';
import { TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
    WrappedNativeTokenStackRoutes,
} from '@suite-native/navigation';
import {
    type TokensRootState as NativeTokensRootState,
    selectAccountTokenInfo,
    selectIsUnrecognizedToken,
} from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { YieldDisabledAlert } from './YieldDisabledAlert';
import { useMessageSystemWrappedNative } from '../hooks/useMessageSystemWrappedNative';
import { useWrappedNativeFirmwareUpdateAlert } from '../hooks/useWrappedNativeFirmwareUpdateAlert';
import { getWrappedNativeTokenEntries } from '../utils/wrappedNativeTokenEntryUtils';

const detailRowStyle = prepareNativeStyle(({ spacings }) => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: spacings.sp40,
}));

const cardStyle = prepareNativeStyle(({ colors, borders, boxShadows, spacings }) => ({
    paddingVertical: spacings.sp10,
    backgroundColor: colors.surfaceFillSunken,
    borderColor: colors.surfaceBorderSunken,
    borderWidth: borders.widths.small,
    ...boxShadows.none,
}));

type DetailRowProps = {
    label: ReactNode;
    children: ReactNode;
};

const DetailRow = ({ label, children }: DetailRowProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <View style={applyStyle(detailRowStyle)}>
            <Text variant="body-sm-strong">{label}</Text>
            {children}
        </View>
    );
};

type TokenSettingsBottomSheetProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    onNavigateAway?: () => void;
};

export const TokenSettingsBottomSheet = forwardRef(
    (
        { accountKey, tokenContract, onNavigateAway }: TokenSettingsBottomSheetProps,
        ref: Ref<BottomSheetModalMethods>,
    ) => {
        const { applyStyle } = useNativeStyles();
        const dispatch = useDispatch();
        const { analytics } = useServices(selectNativeAnalyticsDep);
        const navigation =
            useNavigation<
                StackNavigationProps<RootStackParamList, RootStackRoutes.AccountDetail>
            >();

        const token = useSelector((state: NativeTokensRootState) =>
            selectAccountTokenInfo(state, accountKey, tokenContract),
        );
        const account = useSelector((state: AccountsRootState) =>
            selectAccountByKey(state, accountKey),
        );
        const symbol = useSelector((state: AccountsRootState) =>
            selectAccountNetworkSymbol(state, accountKey),
        );
        const hiddenTokens = useSelector((state: TokensRootState) =>
            selectAccountHiddenTokens(state, accountKey),
        );
        const isUnrecognized = useSelector((state: TokenDefinitionsRootState & AccountsRootState) =>
            selectIsUnrecognizedToken(state, accountKey, tokenContract),
        );
        const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
        const { isFirmwareSupported, showFirmwareUpdateAlert } =
            useWrappedNativeFirmwareUpdateAlert();
        const {
            isDisabled: isWrapDisabled,
            content: wrapDisabledContent,
            variant: wrapDisabledVariant,
        } = useMessageSystemWrappedNative('wrap');
        const {
            isDisabled: isUnwrapDisabled,
            content: unwrapDisabledContent,
            variant: unwrapDisabledVariant,
        } = useMessageSystemWrappedNative('unwrap');

        if (!account || !symbol) return null;

        const displaySymbol = getDisplaySymbol(account.symbol);

        const balance = token?.balance ?? account.balance;
        const networkName = getNetwork(symbol).name;

        const isHidden = hiddenTokens.some(
            t => t.contract.toLowerCase() === tokenContract?.toLowerCase(),
        );

        const handleToggleHide = () => {
            if (!tokenContract) return;

            dispatch(
                tokenDefinitionsActions.setTokenStatus({
                    symbol,
                    type: DefinitionType.COIN,
                    status: isHidden ? TokenManagementAction.SHOW : TokenManagementAction.HIDE,
                    contractAddress: tokenContract,
                }),
            );
        };

        const { unwrap: unwrapEntry, wrap: wrapEntry } = getWrappedNativeTokenEntries({
            isDebugEnvironment: isDevelopOrDebugEnv(),
            isPortfolioTrackerDevice,
            isUnwrapDisabled,
            isWrapDisabled,
            networkType: account.networkType,
            symbol: account.symbol,
            tokenContract,
        });

        const handleUnwrapPress = () => {
            onNavigateAway?.();

            if (!isFirmwareSupported) {
                showFirmwareUpdateAlert();

                return;
            }

            analytics.report({
                type: events.yieldNavigateEvent.name,
                payload: {
                    action: 'continue',
                    from: 'account-detail',
                    to: 'unwrap-form',
                    networkSymbol: account.symbol,
                },
            });

            navigation.navigate(RootStackRoutes.WrappedNativeTokenNavigator, {
                screen: WrappedNativeTokenStackRoutes.UnwrapNativeToken,
                params: { accountKey },
            });
        };

        const handleWrapPress = () => {
            onNavigateAway?.();

            if (!isFirmwareSupported) {
                showFirmwareUpdateAlert();

                return;
            }

            analytics.report({
                type: events.yieldNavigateEvent.name,
                payload: {
                    action: 'continue',
                    from: 'account-detail',
                    to: 'wrap-form',
                    networkSymbol: account.symbol,
                },
            });

            navigation.navigate(RootStackRoutes.WrappedNativeTokenNavigator, {
                screen: WrappedNativeTokenStackRoutes.WrapNativeToken,
                params: { accountKey },
            });
        };

        return (
            <BottomSheetModal ref={ref} title={token?.name ?? displaySymbol} isCloseDisplayed>
                <VStack spacing="sp16" paddingBottom="sp16">
                    <Card style={applyStyle(cardStyle)}>
                        <VStack>
                            {tokenContract && (
                                <>
                                    <DetailRow
                                        label={
                                            <Translation id="moduleAccountManagement.tokenSettings.contractAddress" />
                                        }
                                    >
                                        <Box flex={1} alignItems="flex-end" marginLeft="sp8">
                                            <AddressFormatter
                                                value={tokenContract}
                                                variant="body-sm"
                                                format="long"
                                            />
                                        </Box>
                                    </DetailRow>

                                    <CardDivider />
                                </>
                            )}

                            <DetailRow
                                label={
                                    <Translation id="moduleAccountManagement.tokenSettings.network" />
                                }
                            >
                                <HStack alignItems="center" spacing="sp8">
                                    <TokenIcon symbol={symbol} size="tiny" />
                                    <Text variant="body-sm">{networkName}</Text>
                                </HStack>
                            </DetailRow>
                            <CardDivider />
                            <DetailRow
                                label={
                                    <Translation id="moduleAccountManagement.tokenSettings.balance" />
                                }
                            >
                                <VStack spacing={0} alignItems="flex-end">
                                    <TokenAmountFormatter
                                        value={balance}
                                        tokenSymbol={token?.symbol ?? toTokenSymbol(account.symbol)}
                                        variant="body-sm"
                                        color="contentPrimary"
                                    />

                                    {!isUnrecognized && (
                                        <>
                                            {tokenContract ? (
                                                <TokenToFiatAmountFormatter
                                                    symbol={symbol}
                                                    value={balance}
                                                    contract={tokenContract}
                                                    variant="body-sm"
                                                    color="contentSecondary"
                                                />
                                            ) : (
                                                <CoinToFiatAmountFormatter
                                                    accountKey={accountKey}
                                                    value={balance}
                                                    variant="body-sm"
                                                    color="contentSecondary"
                                                />
                                            )}
                                        </>
                                    )}
                                </VStack>
                            </DetailRow>
                        </VStack>
                    </Card>

                    {!!tokenContract && (
                        <TouchableSwitchRow
                            icon="eyeSlash"
                            accessibilityLabel="Hide token"
                            text={
                                <Translation id="moduleAccountManagement.tokenSettings.hideToken" />
                            }
                            isChecked={isHidden}
                            onChange={handleToggleHide}
                            testID="@token-detail/hide-token-switch"
                        />
                    )}
                    {unwrapEntry.isDisplayed && (
                        <VStack spacing="sp12">
                            {unwrapEntry.isDisabled && (
                                <YieldDisabledAlert
                                    type="unwrap"
                                    content={unwrapDisabledContent}
                                    variant={unwrapDisabledVariant}
                                />
                            )}
                            <Button
                                intent="neutral"
                                priority="secondary"
                                isDisabled={unwrapEntry.isDisabled}
                                onPress={handleUnwrapPress}
                                testID="@token-detail/unwrap-native-token-button"
                            >
                                <Translation id="earn.unwrapNativeToken.entryButton" />
                            </Button>
                        </VStack>
                    )}
                    {wrapEntry.isDisplayed && (
                        <VStack spacing="sp12">
                            {wrapEntry.isDisabled && (
                                <YieldDisabledAlert
                                    type="wrap"
                                    content={wrapDisabledContent}
                                    variant={wrapDisabledVariant}
                                />
                            )}
                            <Button
                                intent="accentViolet"
                                isDisabled={wrapEntry.isDisabled}
                                onPress={handleWrapPress}
                                testID="@account-detail/wrap-native-token-button"
                            >
                                <Translation id="earn.wrapNativeToken.entryButton" />
                            </Button>
                        </VStack>
                    )}
                </VStack>
            </BottomSheetModal>
        );
    },
);
