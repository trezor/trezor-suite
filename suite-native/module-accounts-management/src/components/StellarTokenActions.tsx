import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { isZero } from '@suite-common/wallet-utils';
import { useAlert } from '@suite-native/alerts';
import { Box, Button } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { composeStellarTrustlineFeesThunk } from '@suite-native/module-stellar-token-management';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
    StellarManageTokenStackRoutes,
} from '@suite-native/navigation';
import { type TokensRootState, selectAccountTokenBalance } from '@suite-native/tokens';

type StellarTokenActionsProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.AccountDetail>;

export const StellarTokenActions = ({ accountKey, tokenContract }: StellarTokenActionsProps) => {
    const navigation = useNavigation<NavigationProp>();
    const { showAlert } = useAlert();
    const { translate } = useTranslate();
    const dispatch = useDispatch();

    const [isComposingFees, setIsComposingFees] = useState(false);

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const tokenBalance = useSelector((state: TokensRootState) =>
        selectAccountTokenBalance(state, accountKey, tokenContract),
    );

    if (!account || account.networkType !== 'stellar' || !tokenContract) {
        return null;
    }

    const handleDeactivateToken = async () => {
        // Check if token has balance > 0
        const hasBalance = !isZero(tokenBalance ?? '0');
        if (hasBalance) {
            showAlert({
                title: translate('moduleStellarToken.deactivationFee.cantDeactivateTitle'),
                description: translate(
                    'moduleStellarToken.deactivationFee.cantDeactivateDescription',
                ),
                primaryButtonTitle: translate('generic.buttons.gotIt'),
            });

            return;
        }

        setIsComposingFees(true);
        try {
            // Compose fee levels BEFORE navigating (like trading module)
            const result = await dispatch(
                composeStellarTrustlineFeesThunk({
                    accountKey,
                    tokenContract,
                }),
            );

            if (isFulfilled(result)) {
                navigation.navigate(RootStackRoutes.StellarManageTokenStack, {
                    screen: StellarManageTokenStackRoutes.DeactivationFee,
                    params: {
                        accountKey,
                        tokenContract,
                    },
                });
            } else {
                // Show error when fee composition fails (e.g., offline/slow fetch)
                showAlert({
                    title: translate('moduleStellarToken.deactivationFee.deactivationFailed'),
                    description: translate(
                        'moduleStellarToken.deactivationFee.deactivationFailedDescription',
                    ),
                    primaryButtonTitle: translate('generic.buttons.gotIt'),
                });
            }
        } finally {
            setIsComposingFees(false);
        }
    };

    return (
        <Box paddingHorizontal="sp16">
            <Button
                intent="neutral"
                priority="secondary"
                onPress={handleDeactivateToken}
                isLoading={isComposingFees}
                isDisabled={isComposingFees}
                testID="@account-detail/deactivate-token-button"
            >
                <Translation id="moduleStellarToken.accountDetail.deactivateToken" />
            </Button>
        </Box>
    );
};
