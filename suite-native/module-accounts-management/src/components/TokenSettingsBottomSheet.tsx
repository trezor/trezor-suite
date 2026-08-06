import { type ReactNode, type Ref, forwardRef } from 'react';
import { View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { type BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { useNavigation } from '@react-navigation/native';

import { selectSelectedDevice } from '@suite-common/device';
import {
    DefinitionType,
    type TokenDefinitionsRootState,
    TokenManagementAction,
    tokenDefinitionsActions,
} from '@suite-common/token-definitions';
import {
    getDisplaySymbol,
    getNetwork,
    getWrappedNativeAddress,
    isWrappedNativeToken,
} from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type TokensRootState,
    isWrappedNativeFlowSupported,
    selectAccountByKey,
    selectAccountHiddenTokens,
    selectAccountNetworkSymbol,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress, toTokenSymbol } from '@suite-common/wallet-types';
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
import { useStablecoinYieldFirmwareUpdateAlert } from '@suite-native/module-earn';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
    WrappedNativeTokenStackRoutes,
} from '@suite-native/navigation';
import {
    type TokensRootState as NativeTokensRootState,
    selectAccountTokenInfo,
} from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { selectIsUnrecognizedToken } from '../selectors';

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
        const device = useSelector(selectSelectedDevice);
        const { showFirmwareUpdateAlert } = useStablecoinYieldFirmwareUpdateAlert();

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

        const isUnwrapDisplayed =
            account.networkType === 'ethereum' &&
            isWrappedNativeToken(account.symbol, tokenContract);
        const isWrapDisplayed =
            isDevelopOrDebugEnv() &&
            !tokenContract &&
            account.networkType === 'ethereum' &&
            !!getWrappedNativeAddress(account.symbol);

        const isWrappedNativeFirmwareSupported = isWrappedNativeFlowSupported(device);

        const handleUnwrapPress = () => {
            onNavigateAway?.();

            if (!isWrappedNativeFirmwareSupported) {
                showFirmwareUpdateAlert();

                return;
            }

            navigation.navigate(RootStackRoutes.WrappedNativeTokenNavigator, {
                screen: WrappedNativeTokenStackRoutes.UnwrapNativeToken,
                params: { accountKey },
            });
        };

        const handleWrapPress = () => {
            onNavigateAway?.();

            if (!isWrappedNativeFirmwareSupported) {
                showFirmwareUpdateAlert();

                return;
            }

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
                    {isUnwrapDisplayed && (
                        <Button
                            intent="neutral"
                            priority="secondary"
                            onPress={handleUnwrapPress}
                            testID="@token-detail/unwrap-native-token-button"
                        >
                            <Translation id="earn.unwrapNativeToken.entryButton" />
                        </Button>
                    )}
                    {isWrapDisplayed && (
                        <Button
                            intent="accentViolet"
                            onPress={handleWrapPress}
                            testID="@account-detail/wrap-native-token-button"
                        >
                            <Translation id="earn.wrapNativeToken.entryButton" />
                        </Button>
                    )}
                </VStack>
            </BottomSheetModal>
        );
    },
);
