import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/core';
import { FlashList } from '@shopify/flash-list';

import { Translation } from '@suite-native/intl';
import {
    selectFilterKnownTokens,
    TokenDefinitionsRootState,
} from '@suite-common/token-definitions';
import { getNetwork, type NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    PORTFOLIO_TRACKER_DEVICE_STATE,
    selectAccountsByNetworkAndDeviceState,
} from '@suite-common/wallet-core';
import { TokenAddress, TokenSymbol } from '@suite-common/wallet-types';
import { AccountFormValues, useAccountLabelForm } from '@suite-native/accounts';
import { analytics, EventType } from '@suite-native/analytics';
import { Box, Button, Text } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import {
    AccountsImportStackParamList,
    AccountsImportStackRoutes,
    RootStackParamList,
    StackToStackCompositeNavigationProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { AccountInfo, TokenInfo } from '@trezor/connect';

import { importAccountThunk } from '../accountsImportThunks';
import { useShowImportError } from '../useShowImportError';
import { AccountImportOverview } from './AccountImportOverview';
import { AccountImportSummaryScreen } from './AccountImportSummaryScreen';
import { TokenInfoCard } from './TokenInfoCard';

type AccountImportConfirmFormScreenProps = {
    symbol: NetworkSymbol;
    accountInfo: AccountInfo;
};

type NavigationProp = StackToStackCompositeNavigationProps<
    AccountsImportStackParamList,
    AccountsImportStackRoutes.AccountImportLoading,
    RootStackParamList
>;

export const AccountImportConfirmFormScreen = ({
    symbol,
    accountInfo,
}: AccountImportConfirmFormScreenProps) => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProp>();
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const showImportError = useShowImportError(symbol, navigation);

    const knownTokens = useSelector((state: TokenDefinitionsRootState) =>
        selectFilterKnownTokens(state, symbol, accountInfo.tokens ?? []),
    );

    const deviceNetworkAccounts = useSelector((state: AccountsRootState) =>
        selectAccountsByNetworkAndDeviceState(state, PORTFOLIO_TRACKER_DEVICE_STATE, symbol),
    );

    const defaultAccountLabel = `${getNetwork(symbol).name} #${deviceNetworkAccounts.length + 1}`;

    const form = useAccountLabelForm(defaultAccountLabel);
    const {
        handleSubmit,
        formState: { isValid },
    } = form;

    const handleImportAccount = handleSubmit(async ({ accountLabel }: AccountFormValues) => {
        try {
            await dispatch(
                importAccountThunk({
                    accountInfo,
                    accountLabel,
                    symbol,
                }),
            ).unwrap();

            analytics.report({
                type: EventType.AssetsSync,
                payload: {
                    assetSymbol: symbol,
                    tokenSymbols: knownTokens.map(token => token.symbol as TokenSymbol),
                    tokenAddresses: knownTokens.map(token => token.contract as TokenAddress),
                },
            });

            navigateToInitialScreen();
        } catch {
            showImportError();
        }
    });

    const renderItem = useCallback(
        ({ item }: { item: TokenInfo }) => (
            <Box marginBottom="sp12">
                <TokenInfoCard
                    symbol={symbol}
                    tokenSymbol={item.symbol as TokenSymbol}
                    balance={item.balance}
                    decimals={item.decimals}
                    name={item.name}
                    contract={item.contract as TokenAddress}
                />
            </Box>
        ),
        [symbol],
    );

    return (
        <Form form={form}>
            <AccountImportSummaryScreen
                title={<Translation id="moduleAccountImport.summaryScreen.title.confirmToAdd" />}
                footer={
                    <Button
                        testID="@account-import/coin-synced/confirm-button"
                        onPress={handleImportAccount}
                        size="large"
                        isDisabled={!isValid}
                    >
                        <Translation id="generic.buttons.confirm" />
                    </Button>
                }
            >
                <FlashList
                    data={knownTokens}
                    renderItem={renderItem}
                    ListEmptyComponent={null}
                    ListHeaderComponent={
                        <>
                            <AccountImportOverview
                                balance={accountInfo.balance}
                                symbol={symbol}
                                formControl={form.control}
                            />
                            {knownTokens.length > 0 && (
                                <Box marginTop="sp16" marginBottom="sp8">
                                    <Text variant="titleSmall">
                                        <Translation id="moduleAccountImport.summaryScreen.tokens" />
                                    </Text>
                                </Box>
                            )}
                        </>
                    }
                    estimatedItemSize={115}
                />
            </AccountImportSummaryScreen>
        </Form>
    );
};
