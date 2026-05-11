import { type ReactNode, type Ref, forwardRef } from 'react';
import { View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { type BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import {
    DefinitionType,
    TokenManagementAction,
    tokenDefinitionsActions,
} from '@suite-common/token-definitions';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type TokensRootState,
    selectAccountByKey,
    selectAccountHiddenTokens,
    selectAccountNetworkSymbol,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import {
    BottomSheetModal,
    Box,
    Card,
    CardDivider,
    HStack,
    Text,
    TouchableSwitchRow,
    VStack,
} from '@suite-native/atoms';
import {
    AddressFormatter,
    TokenAmountFormatter,
    TokenToFiatAmountFormatter,
} from '@suite-native/formatters';
import { CryptoIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    type TokensRootState as NativeTokensRootState,
    selectAccountTokenInfo,
} from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const detailRowStyle = prepareNativeStyle(({ spacings }) => ({
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    height: spacings.sp40,
}));

const cardStyle = prepareNativeStyle(({ colors, borders, boxShadows, spacings }) => ({
    paddingVertical: spacings.sp10,
    backgroundColor: colors.legacyBackgroundTertiaryDefaultOnElevation1,
    borderColor: colors.borderNeutral,
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
    tokenContract: TokenAddress;
};

export const TokenSettingsBottomSheet = forwardRef(
    (
        { accountKey, tokenContract }: TokenSettingsBottomSheetProps,
        ref: Ref<BottomSheetModalMethods>,
    ) => {
        const { applyStyle } = useNativeStyles();
        const dispatch = useDispatch();

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

        if (!token || !account || !symbol) return null;

        const balance = token.balance ?? '0';
        const networkName = getNetwork(symbol).name;
        const isHidden = hiddenTokens.some(
            t => t.contract.toLowerCase() === tokenContract.toLowerCase(),
        );

        const handleToggleHide = () => {
            dispatch(
                tokenDefinitionsActions.setTokenStatus({
                    symbol,
                    type: DefinitionType.COIN,
                    status: isHidden ? TokenManagementAction.SHOW : TokenManagementAction.HIDE,
                    contractAddress: tokenContract,
                }),
            );
        };

        return (
            <BottomSheetModal ref={ref} title={token.name ?? tokenContract} isCloseDisplayed>
                <VStack spacing="sp16" paddingBottom="sp16">
                    <Card style={applyStyle(cardStyle)}>
                        <VStack>
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
                            <DetailRow
                                label={
                                    <Translation id="moduleAccountManagement.tokenSettings.network" />
                                }
                            >
                                <HStack alignItems="center" spacing="sp8">
                                    <CryptoIcon symbol={symbol} size="tiny" />
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
                                        tokenSymbol={token.symbol}
                                        decimals={token.decimals}
                                        variant="body-sm"
                                        color="contentPrimary"
                                    />
                                    <TokenToFiatAmountFormatter
                                        symbol={symbol}
                                        value={balance}
                                        contract={tokenContract}
                                        decimals={token.decimals}
                                        variant="body-sm"
                                        color="contentSecondary"
                                    />
                                </VStack>
                            </DetailRow>
                        </VStack>
                    </Card>
                    <TouchableSwitchRow
                        icon="eyeSlash"
                        accessibilityLabel="Hide token"
                        text={<Translation id="moduleAccountManagement.tokenSettings.hideToken" />}
                        isChecked={isHidden}
                        onChange={handleToggleHide}
                        testID="@token-detail/hide-token-switch"
                    />
                </VStack>
            </BottomSheetModal>
        );
    },
);
