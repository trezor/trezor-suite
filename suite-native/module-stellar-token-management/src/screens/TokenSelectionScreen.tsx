import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation, useRoute } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import type { StellarTokenInfo, TokenAddress } from '@suite-common/wallet-types';
import { useAlert } from '@suite-native/alerts';
import { Box, Button, Card, Loader, SearchInput, Text, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    Screen,
    ScreenHeader,
    type StackNavigationProps,
    type StackProps,
    type StellarManageTokenStackParamList,
    StellarManageTokenStackRoutes,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { TokenListItem } from '../components/TokenListItem';
import { useInactiveStellarTokens } from '../hooks/useInactiveStellarTokens';
import { composeStellarTrustlineFeesThunk } from '../thunks';

type RouteProps = StackProps<
    StellarManageTokenStackParamList,
    StellarManageTokenStackRoutes.TokenSelection
>['route'];

type NavigationProps = StackNavigationProps<
    StellarManageTokenStackParamList,
    StellarManageTokenStackRoutes.TokenSelection
>;

const keyExtractor = (item: StellarTokenInfo) => item.contract;

const loadingOverlayStyle = prepareNativeStyle(_ => ({
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
}));

export const TokenSelectionScreen = () => {
    const route = useRoute<RouteProps>();
    const { accountKey } = route.params;
    const navigation = useNavigation<NavigationProps>();
    const { translate } = useTranslate();
    const { showAlert } = useAlert();
    const { applyStyle } = useNativeStyles();
    const dispatch = useDispatch();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const { inactiveTokens, isLoading } = useInactiveStellarTokens(accountKey);

    const [searchQuery, setSearchQuery] = useState('');
    const [isComposingFees, setIsComposingFees] = useState(false);

    const filteredTokens = useMemo(() => {
        if (!searchQuery) return inactiveTokens;

        const query = searchQuery.toLowerCase();

        return inactiveTokens.filter(
            token =>
                token.symbol?.toLowerCase().includes(query) ||
                token.name?.toLowerCase().includes(query) ||
                token.contract.toLowerCase().includes(query),
        );
    }, [inactiveTokens, searchQuery]);

    const navigateToActivationFee = useCallback(
        async (tokenContract: TokenAddress) => {
            setIsComposingFees(true);
            try {
                // Compose fee levels BEFORE navigating (like trading module)
                const result = await dispatch(
                    composeStellarTrustlineFeesThunk({ accountKey, tokenContract }),
                );

                if (isFulfilled(result)) {
                    navigation.navigate(StellarManageTokenStackRoutes.ActivationFee, {
                        accountKey,
                        tokenContract,
                    });
                } else {
                    // Show error when fee composition fails (e.g., offline/slow fetch)
                    showAlert({
                        title: translate('moduleStellarToken.networkFee.activationFailed'),
                        description: translate(
                            'moduleStellarToken.networkFee.activationFailedDescription',
                        ),
                        primaryButtonTitle: translate('generic.buttons.gotIt'),
                    });
                }
            } finally {
                setIsComposingFees(false);
            }
        },
        [accountKey, dispatch, navigation, showAlert, translate],
    );

    const handleTokenPress = useCallback(
        (token: StellarTokenInfo) => {
            navigateToActivationFee(token.contract as TokenAddress);
        },
        [navigateToActivationFee],
    );

    const handleManualActivate = useCallback(() => {
        navigation.navigate(StellarManageTokenStackRoutes.ManualTokenInput, {
            accountKey,
        });
    }, [accountKey, navigation]);

    const renderItem = useCallback(
        ({ item }: { item: StellarTokenInfo }) => (
            <TokenListItem token={item} onPress={() => handleTokenPress(item)} />
        ),
        [handleTokenPress],
    );

    if (!account) return null;

    return (
        <Screen
            header={
                <ScreenHeader
                    title={<Translation id="moduleStellarToken.screenTitle.activateToken" />}
                    closeActionType="back"
                />
            }
            isScrollable={false}
        >
            <VStack spacing="sp16" flex={1}>
                <VStack spacing="sp8">
                    <Text variant="headline-md">
                        <Translation id="moduleStellarToken.tokenSelection.title" />
                    </Text>
                    <Text variant="body-md" color="textSubdued">
                        <Translation id="moduleStellarToken.tokenSelection.subtitle" />
                    </Text>
                </VStack>

                <SearchInput
                    onChange={setSearchQuery}
                    placeholder={translate('moduleStellarToken.tokenSelection.searchPlaceholder')}
                />

                <Box flex={1}>
                    {isLoading ? (
                        <Box flex={1} alignItems="center" justifyContent="center">
                            <Loader />
                        </Box>
                    ) : (
                        <Card noPadding>
                            <FlatList
                                data={filteredTokens}
                                renderItem={renderItem}
                                keyExtractor={keyExtractor}
                                showsVerticalScrollIndicator={false}
                                ListEmptyComponent={
                                    <Box padding="sp16" alignItems="center">
                                        <Text variant="body-md" color="textSubdued">
                                            <Translation id="moduleStellarToken.tokenSelection.noResults" />
                                        </Text>
                                    </Box>
                                }
                            />
                        </Card>
                    )}
                </Box>

                <Button
                    colorScheme="tertiaryElevation0"
                    viewLeft="plus"
                    onPress={handleManualActivate}
                    testID="@stellar-token/activate-manually-button"
                >
                    <Translation id="moduleStellarToken.tokenSelection.activateManually" />
                </Button>
            </VStack>

            {isComposingFees && (
                <Box style={applyStyle(loadingOverlayStyle)}>
                    <Loader />
                </Box>
            )}
        </Screen>
    );
};
