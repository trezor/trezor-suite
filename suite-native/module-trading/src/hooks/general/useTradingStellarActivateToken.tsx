import { useCallback, useMemo, useState } from 'react';
import { FadeIn } from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';
import { type BuyTrade, type CryptoId, type ExchangeTrade } from 'invity-api';

import { cryptoIdToNetworkAndContractAddress } from '@suite-common/trading';
import { type TokenAddress } from '@suite-common/wallet-types';
import { useAlert } from '@suite-native/alerts';
import { AnimatedBox, Button } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    composeStellarTrustlineFeesThunk,
    useInactiveStellarTokens,
} from '@suite-native/module-stellar-token-management';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
    StellarManageTokenStackRoutes,
} from '@suite-native/navigation';
import { selectExchangeSelectedReceiveAccount } from '@suite-native/trading-state';

type NavigationProps = StackNavigationProps<RootStackParamList, RootStackRoutes.AppTabs>;

interface UseTradingStellarActivateTokenProps {
    quote?: ExchangeTrade | BuyTrade | undefined;
    receiveCryptoId?: CryptoId;
    buttonTestId?: string;
}

export const useTradingStellarActivateToken = ({
    quote,
    receiveCryptoId,
    buttonTestId,
}: UseTradingStellarActivateTokenProps) => {
    const dispatch = useDispatch();
    const { translate } = useTranslate();
    const { showAlert } = useAlert();

    const navigation = useNavigation<NavigationProps>();

    const selectedReceiveAccount = useSelector(selectExchangeSelectedReceiveAccount);

    const { contractAddress: receiveContractAddress } =
        cryptoIdToNetworkAndContractAddress(receiveCryptoId);

    const { inactiveTokens } = useInactiveStellarTokens(selectedReceiveAccount?.account.key);

    const isReceivingInactiveStellarToken =
        !!quote &&
        !!selectedReceiveAccount &&
        !!receiveContractAddress &&
        !!inactiveTokens.find(token => token.contract === receiveContractAddress);

    const [isComposingFees, setIsComposingFees] = useState(false);

    const onActivatePress = useCallback(async () => {
        if (!selectedReceiveAccount) return;
        if (!receiveContractAddress) return;

        const accountKey = selectedReceiveAccount.account.key;
        const tokenContract = receiveContractAddress as TokenAddress;

        setIsComposingFees(true);

        try {
            const result = await dispatch(
                composeStellarTrustlineFeesThunk({ accountKey, tokenContract }),
            );

            if (isFulfilled(result)) {
                navigation.navigate(RootStackRoutes.StellarManageTokenStack, {
                    screen: StellarManageTokenStackRoutes.ActivationFee,
                    params: {
                        accountKey: selectedReceiveAccount.account.key,
                        tokenContract: receiveContractAddress as TokenAddress,
                        isTrading: true,
                    },
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
            setIsComposingFees(false);
        }
    }, [
        selectedReceiveAccount,
        receiveContractAddress,
        dispatch,
        navigation,
        showAlert,
        translate,
    ]);

    const activateButtonElement = useMemo(() => {
        if (!isReceivingInactiveStellarToken) {
            return null;
        }

        return (
            <AnimatedBox entering={FadeIn}>
                <Button onPress={onActivatePress} testID={buttonTestId} isLoading={isComposingFees}>
                    <Translation id="generic.buttons.continue" />
                </Button>
            </AnimatedBox>
        );
    }, [isReceivingInactiveStellarToken, isComposingFees, buttonTestId, onActivatePress]);

    return { isReceivingInactiveStellarToken, activateButtonElement };
};
