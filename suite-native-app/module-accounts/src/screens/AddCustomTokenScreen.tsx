import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { isFulfilled } from '@reduxjs/toolkit';

import { isEvmAddress } from '@suite-common/address';
import {
    type AccountsRootState,
    type CustomTokenFetchError,
    type CustomTokenInputError,
    type TokensRootState,
    addCustomTokenThunk,
    fetchCustomTokenThunk,
    getCustomTokenInputError,
    selectAccountByKey,
    selectAccountHiddenTokens,
} from '@suite-common/wallet-core';
import { enhanceTokens } from '@suite-common/wallet-utils';
import { BannerInline, Box, Button, Card, Input, Loader, Text, VStack } from '@suite-native/atoms';
import { Translation, type TxKeyPath, useTranslate } from '@suite-native/intl';
import {
    type RootStackParamList,
    type RootStackRoutes,
    Screen,
    ScreenHeader,
} from '@suite-native/navigation';
import { useToast } from '@suite-native/toasts';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

type AddCustomTokenScreenProps = NativeStackScreenProps<
    RootStackParamList,
    RootStackRoutes.AddCustomToken
>;

type Token = Parameters<typeof addCustomTokenThunk>[0]['token'];

const errorMessages: Record<CustomTokenInputError | CustomTokenFetchError, TxKeyPath> = {
    'invalid-address': 'moduleAccounts.addCustomToken.errors.invalidAddress',
    'already-added': 'moduleAccounts.addCustomToken.errors.alreadyAdded',
    'not-a-token': 'moduleAccounts.addCustomToken.errors.notAToken',
    'fetch-failed': 'moduleAccounts.addCustomToken.errors.fetchFailed',
};

export const AddCustomTokenScreen = ({
    route: {
        params: { accountKey },
    },
    navigation,
}: AddCustomTokenScreenProps) => {
    const { dispatch } = useServices(injectDispatch);
    const { translate } = useTranslate();
    const { showToast } = useToast();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const hiddenTokens = useSelector((state: TokensRootState) =>
        selectAccountHiddenTokens(state, accountKey),
    );

    const [contract, setContract] = useState('');
    const [token, setToken] = useState<Token>();
    const [fetchError, setFetchError] = useState<CustomTokenFetchError>();
    const [isFetching, setIsFetching] = useState(false);

    const trimmedContract = contract.trim();
    const inputError =
        account && trimmedContract
            ? getCustomTokenInputError({
                  contract: trimmedContract,
                  account,
                  hiddenTokens,
                  isAddressValid: isEvmAddress,
              })
            : undefined;
    const canFetch = !!trimmedContract && !inputError;

    useEffect(() => {
        setToken(undefined);
        setFetchError(undefined);
        if (!canFetch) return;

        let isStale = false;
        setIsFetching(true);
        dispatch(fetchCustomTokenThunk({ accountKey, contract: trimmedContract }))
            .then(result => {
                if (isStale) return;
                if (isFulfilled(result)) {
                    setToken(result.payload);
                } else {
                    setFetchError(result.payload ?? 'fetch-failed');
                }
            })
            .finally(() => {
                if (!isStale) setIsFetching(false);
            });

        return () => {
            isStale = true;
        };
    }, [accountKey, canFetch, dispatch, trimmedContract]);

    if (!account) return null;

    const error = inputError ?? fetchError;
    const preview = token ? enhanceTokens([token])[0] : undefined;

    const handleAdd = () => {
        if (!token) return;

        dispatch(addCustomTokenThunk({ accountKey, token }));
        showToast({
            intent: 'neutral',
            icon: 'check',
            message: <Translation id="moduleAccounts.addCustomToken.tokenAdded" />,
        });
        navigation.goBack();
    };

    return (
        <Screen
            header={
                <ScreenHeader
                    title={<Translation id="moduleAccounts.addCustomToken.title" />}
                    closeActionType="back"
                />
            }
            footer={
                <Box paddingHorizontal="sp16" paddingBottom="sp16">
                    <Button
                        onPress={handleAdd}
                        isDisabled={!token}
                        testID="@add-custom-token/add-button"
                    >
                        <Translation id="moduleAccounts.addCustomToken.addButton" />
                    </Button>
                </Box>
            }
        >
            <VStack spacing="sp16">
                <BannerInline
                    intent="warning"
                    title={<Translation id="moduleAccounts.addCustomToken.warning" />}
                />
                <Card>
                    <VStack spacing="sp8">
                        <Text variant="body-md">
                            <Translation id="moduleAccounts.addCustomToken.contractAddress" />
                        </Text>
                        <Input
                            labelType="noLabel"
                            value={contract}
                            onChangeText={setContract}
                            placeholder={translate(
                                'moduleAccounts.addCustomToken.contractAddressPlaceholder',
                            )}
                            autoCapitalize="none"
                            autoCorrect={false}
                            multiline
                            hasError={!!error}
                            testID="@add-custom-token/contract-input"
                        />
                        {error && (
                            <Text variant="body-sm" color="contentCritical">
                                <Translation id={errorMessages[error]} />
                            </Text>
                        )}
                    </VStack>
                </Card>
                {isFetching && (
                    <Loader title={translate('moduleAccounts.addCustomToken.loading')} />
                )}
                {preview && (
                    <Card testID="@add-custom-token/preview">
                        <VStack spacing="sp4">
                            <Text variant="body-md-strong">
                                {preview.name} ({preview.symbol?.toUpperCase()})
                            </Text>
                            <Text variant="body-sm" color="contentSecondary">
                                <Translation id="moduleAccounts.addCustomToken.balance" />:{' '}
                                {preview.balance} {preview.symbol?.toUpperCase()}
                            </Text>
                        </VStack>
                    </Card>
                )}
            </VStack>
        </Screen>
    );
};
