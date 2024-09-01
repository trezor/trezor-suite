import { useDispatch, useSelector } from 'react-redux';

import { CommonActions, useNavigation } from '@react-navigation/core';

import {
    selectFilterKnownTokens,
    TokenDefinitionsRootState,
} from '@suite-common/token-definitions';
import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    PORTFOLIO_TRACKER_DEVICE_STATE,
    selectAccountsByNetworkAndDeviceState,
} from '@suite-common/wallet-core';
import { TokenAddress, TokenInfoBranded, TokenSymbol } from '@suite-common/wallet-types';
import { AccountFormValues, useAccountLabelForm } from '@suite-native/accounts';
import { analytics, EventType } from '@suite-native/analytics';
import { Box, Button, Divider, VStack } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import {
    AccountsImportStackParamList,
    AccountsImportStackRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { selectAnyOfTokensHasFiatRates } from '@suite-native/tokens';
import { AccountInfo } from '@trezor/connect';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { importAccountThunk } from '../accountsImportThunks';
import { useShowImportError } from '../useShowImportError';
import { AccountImportEthereumTokens } from './AccountImportEthereumTokens';
import { AccountImportOverview } from './AccountImportOverview';

type AccountImportSummaryFormProps = {
    networkSymbol: NetworkSymbol;
    accountInfo: AccountInfo;
};

type NavigationProp = StackToStackCompositeNavigationProps<
    AccountsImportStackParamList,
    AccountsImportStackRoutes.AccountImportLoading,
    RootStackParamList
>;

const confirmButtonStyle = prepareNativeStyle(utils => ({
    marginBottom: utils.spacings.small,
}));

export const AccountImportSummaryForm = ({
    networkSymbol,
    accountInfo,
}: AccountImportSummaryFormProps) => {
    const dispatch = useDispatch();
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<NavigationProp>();
    const showImportError = useShowImportError(networkSymbol, navigation);

    const areTokensDisplayed = useSelector((state: TokenDefinitionsRootState) =>
        selectAnyOfTokensHasFiatRates(state, (accountInfo?.tokens as TokenInfoBranded[]) ?? []),
    );

    const knownTokens = useSelector((state: TokenDefinitionsRootState) =>
        selectFilterKnownTokens(state, networkSymbol, accountInfo.tokens ?? []),
    );

    const deviceNetworkAccounts = useSelector((state: AccountsRootState) =>
        selectAccountsByNetworkAndDeviceState(state, PORTFOLIO_TRACKER_DEVICE_STATE, networkSymbol),
    );

    const defaultAccountLabel = `${networks[networkSymbol].name} #${
        deviceNetworkAccounts.length + 1
    }`;

    const form = useAccountLabelForm(defaultAccountLabel);
    const {
        handleSubmit,
        formState: { errors },
    } = form;

    const handleImportAccount = handleSubmit(async ({ accountLabel }: AccountFormValues) => {
        try {
            await dispatch(
                importAccountThunk({
                    accountInfo,
                    accountLabel,
                    coin: networkSymbol,
                }),
            ).unwrap();

            analytics.report({
                type: EventType.AssetsSync,
                payload: {
                    assetSymbol: networkSymbol,
                    tokenSymbols: knownTokens.map(token => token.symbol as TokenSymbol),
                    tokenAddresses: knownTokens.map(token => token.contract as TokenAddress),
                },
            });

            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [
                        {
                            name: RootStackRoutes.AppTabs,
                            params: {
                                screen: HomeStackRoutes.Home,
                            },
                        },
                    ],
                }),
            );
        } catch {
            showImportError();
        }
    });

    return (
        <Form form={form}>
            <VStack spacing="large">
                <AccountImportOverview
                    balance={accountInfo.availableBalance}
                    networkSymbol={networkSymbol}
                />
                {areTokensDisplayed && (
                    <AccountImportEthereumTokens tokens={accountInfo.tokens ?? []} />
                )}
                <Divider marginHorizontal="extraLarge" />
                <Box marginHorizontal="medium">
                    <Button
                        testID="@account-import/coin-synced/confirm-button"
                        onPress={handleImportAccount}
                        size="large"
                        style={applyStyle(confirmButtonStyle)}
                        isDisabled={!!errors.accountLabel}
                    >
                        Confirm
                    </Button>
                </Box>
            </VStack>
        </Form>
    );
};
