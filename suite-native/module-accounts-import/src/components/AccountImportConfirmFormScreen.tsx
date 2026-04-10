import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';

import { PORTFOLIO_TRACKER_DEVICE_STATE } from '@suite-common/device';
import {
    type TokenDefinitionsRootState,
    selectFilterKnownTokens,
} from '@suite-common/token-definitions';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    selectAccountsByNetworkAndDeviceState,
} from '@suite-common/wallet-core';
import { type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';
import { type AccountFormValues, useAccountLabelForm } from '@suite-native/accounts';
import { events } from '@suite-native/analytics';
import { Box, Button, Text } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import {
    type AccountsImportStackParamList,
    type AccountsImportStackRoutes,
    type RootStackParamList,
    type StackToStackCompositeNavigationProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
import { type AccountInfo, type TokenInfo } from '@trezor/connect';

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
    const analytics = useAnalytics();
    const navigation = useNavigation<NavigationProp>();
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const showImportError = useShowImportError(symbol, navigation);

    const knownTokens = useSelector((state: TokenDefinitionsRootState) =>
        selectFilterKnownTokens(state, symbol, accountInfo.tokens ?? []),
    );

    const deviceNetworkAccounts = useSelector((state: AccountsRootState) =>
        selectAccountsByNetworkAndDeviceState(state, PORTFOLIO_TRACKER_DEVICE_STATE, symbol),
    );

    const nonEmptyTokens = knownTokens.filter(info => parseFloat(info.balance ?? '0') > 0);
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
                type: events.assetsSyncEvent.name,
                payload: {
                    assetSymbol: symbol,
                    tokenSymbols: nonEmptyTokens.map(token => token.symbol as TokenSymbol),
                    tokenAddresses: nonEmptyTokens.map(token => token.contract as TokenAddress),
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
                        isDisabled={!isValid}
                    >
                        <Translation id="generic.buttons.confirm" />
                    </Button>
                }
            >
                <AccountImportOverview
                    balance={accountInfo.balance}
                    symbol={symbol}
                    formControl={form.control}
                />
                {nonEmptyTokens.length > 0 && (
                    <FlashList
                        data={nonEmptyTokens}
                        renderItem={renderItem}
                        ListEmptyComponent={null}
                        ListHeaderComponent={
                            <Box marginTop="sp16" marginBottom="sp8">
                                <Text variant="headline-sm">
                                    <Translation id="moduleAccountImport.summaryScreen.tokens" />
                                </Text>
                            </Box>
                        }
                    />
                )}
            </AccountImportSummaryScreen>
        </Form>
    );
};
