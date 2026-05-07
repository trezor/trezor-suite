import { useCallback, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';

import {
    type AccountKey,
    type StellarTokenInfo,
    type TokenAddress,
} from '@suite-common/wallet-types';
import { useAlert } from '@suite-native/alerts';
import { Box, Button, Card, Loader, SearchInput, Text, VStack } from '@suite-native/atoms';
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
type InactiveTokensTabProps = {
    accountKey: AccountKey;
};

export const InactiveTokensTab = ({ accountKey }: InactiveTokensTabProps) => {
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AccountAssets>>();
    const { translate } = useTranslate();
    const { showAlert } = useAlert();
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

    return (
        <VStack spacing="sp16">
            <SearchInput
                onChange={setSearchQuery}
                placeholder={translate('moduleStellarToken.tokenSelection.searchPlaceholder')}
            />

            {isLoading ? (
                <Box alignItems="center" justifyContent="center" paddingVertical="sp24">
                    <Loader />
                </Box>
            ) : (
                <Card noPadding>
                    {filteredTokens.length === 0 ? (
                        <Box padding="sp16" alignItems="center">
                            <Text variant="body-md" color="contentSecondary">
                                <Translation id="moduleStellarToken.tokenSelection.noResults" />
                            </Text>
                        </Box>
                    ) : (
                        filteredTokens.map((token: StellarTokenInfo) => (
                            <InactiveTokenListItem
                                key={token.contract}
                                token={token}
                                onPress={() => handleTokenPress(token.contract as TokenAddress)}
                            />
                        ))
                    )}
                </Card>
            )}

            <Button
                intent="neutral"
                priority="secondary"
                iconLeft="plus"
                onPress={handleManualActivate}
                testID="@stellar-token/activate-manually-button"
            >
                <Translation id="moduleStellarToken.tokenSelection.activateManually" />
            </Button>
        </VStack>
    );
};
