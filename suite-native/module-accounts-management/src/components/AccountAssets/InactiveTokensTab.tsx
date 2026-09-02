import { useCallback, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';
import { FlashList } from '@shopify/flash-list';

import { useDispatch } from '@suite-common/redux-utils';
import {
    type AccountKey,
    type StellarTokenInfo,
    type TokenAddress,
} from '@suite-common/wallet-types';
import { useAlert } from '@suite-native/alerts';
import { Box, Button, Loader, SearchInput, Text } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    InactiveTokenListItem,
    composeStellarTrustlineFeesThunk,
    useInactiveStellarTokens,
} from '@suite-native/module-stellar-token-management';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
    StellarManageTokenStackRoutes,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type InactiveTokensTabProps = {
    accountKey: AccountKey;
};

const tokenItemWrapperStyle = prepareNativeStyle<{ isFirst: boolean; isLast: boolean }>(
    (utils, { isFirst, isLast }) => ({
        backgroundColor: utils.colors.surfaceFillRaised,
        borderTopLeftRadius: isFirst ? utils.borders.radii.r16 : 0,
        borderTopRightRadius: isFirst ? utils.borders.radii.r16 : 0,
        borderBottomLeftRadius: isLast ? utils.borders.radii.r16 : 0,
        borderBottomRightRadius: isLast ? utils.borders.radii.r16 : 0,
        overflow: 'hidden',
    }),
);

const listFooterStyle = prepareNativeStyle(utils => ({
    paddingTop: utils.spacings.sp16,
}));

export const InactiveTokensTab = ({ accountKey }: InactiveTokensTabProps) => {
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AccountAssets>>();
    const { translate } = useTranslate();
    const { showAlert } = useAlert();
    const { applyStyle } = useNativeStyles();
    const dispatch = useDispatch();

    const { inactiveTokens, isLoading } = useInactiveStellarTokens(accountKey);

    const [searchQuery, setSearchQuery] = useState('');
    const isComposingFeesRef = useRef(false);

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

    const handleTokenPress = useCallback(
        async (tokenContract: TokenAddress) => {
            if (isComposingFeesRef.current) return;
            isComposingFeesRef.current = true;
            try {
                const result = await dispatch(
                    composeStellarTrustlineFeesThunk({ accountKey, tokenContract }),
                );

                if (isFulfilled(result)) {
                    navigation.navigate(RootStackRoutes.StellarManageTokenStack, {
                        screen: StellarManageTokenStackRoutes.ActivationFee,
                        params: { accountKey, tokenContract },
                    });
                } else {
                    showAlert({
                        title: translate('moduleStellarToken.networkFee.activationFailed'),
                        description: translate(
                            'moduleStellarToken.networkFee.activationFailedDescription',
                        ),
                        primaryButtonTitle: translate('generic.buttons.gotIt'),
                    });
                }
            } finally {
                isComposingFeesRef.current = false;
            }
        },
        [accountKey, dispatch, navigation, showAlert, translate],
    );

    const handleManualActivate = useCallback(() => {
        navigation.navigate(RootStackRoutes.StellarManageTokenStack, {
            screen: StellarManageTokenStackRoutes.ManualTokenInput,
            params: { accountKey },
        });
    }, [accountKey, navigation]);

    const renderItem = useCallback(
        ({ item, index }: { item: StellarTokenInfo; index: number }) => (
            <View
                style={applyStyle(tokenItemWrapperStyle, {
                    isFirst: index === 0,
                    isLast: index === filteredTokens.length - 1,
                })}
            >
                <InactiveTokenListItem
                    token={item}
                    onPress={() => handleTokenPress(item.contract as TokenAddress)}
                />
            </View>
        ),
        [applyStyle, filteredTokens.length, handleTokenPress],
    );

    return (
        <FlashList
            data={filteredTokens}
            keyExtractor={item => item.contract}
            renderItem={renderItem}
            ListHeaderComponent={
                <Box paddingBottom="sp16">
                    <SearchInput
                        onChange={setSearchQuery}
                        placeholder={translate(
                            'moduleStellarToken.tokenSelection.searchPlaceholder',
                        )}
                    />
                    {isLoading && (
                        <Box alignItems="center" justifyContent="center" paddingVertical="sp24">
                            <Loader />
                        </Box>
                    )}
                </Box>
            }
            ListEmptyComponent={
                !isLoading ? (
                    <Box padding="sp16" alignItems="center">
                        <Text variant="body-md" color="contentSecondary">
                            <Translation id="moduleStellarToken.tokenSelection.noResults" />
                        </Text>
                    </Box>
                ) : null
            }
            ListFooterComponent={
                <View style={applyStyle(listFooterStyle)}>
                    <Button
                        intent="neutral"
                        priority="secondary"
                        iconLeft="plus"
                        onPress={handleManualActivate}
                        testID="@stellar-token/activate-manually-button"
                    >
                        <Translation id="moduleStellarToken.tokenSelection.activateManually" />
                    </Button>
                </View>
            }
        />
    );
};
