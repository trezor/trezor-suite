import { ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Text, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    RootStackParamList,
    StackToStackCompositeNavigationProps,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { Color } from '@trezor/theme';

import { useTradingBuyFormContext } from '../../hooks/useTradingBuyFormContext';
import { selectBuySelectedReceiveAccount } from '../../selectors/buySelectors';
import { getSelectedSymbolFromBuyForm } from '../../utils/tradeableAssetUtils';
import { AccountAddress } from '../general/AccountAddress';
import { TradingOverviewRow } from '../general/TradingOverviewRow';

type RightTextProps = {
    children: ReactNode;
    color: Color;
    variant?: 'body' | 'hint';
};

type ReceiveAccountPickerRightProps = {
    selectedAccountLabel: string | undefined;
    selectedAddress: string | undefined;
};
export type NavigationProps = StackToStackCompositeNavigationProps<
    TradingStackParamList,
    TradingStackRoutes.ReceiveAccounts,
    RootStackParamList
>;

const RightText = ({ color, variant = 'body', children }: RightTextProps) => (
    <Text color={color} variant={variant} textAlign="right" ellipsizeMode="tail" numberOfLines={1}>
        {children}
    </Text>
);

const ReceiveAccountPickerRight = ({
    selectedAccountLabel,
    selectedAddress,
}: ReceiveAccountPickerRightProps) => {
    if (!selectedAccountLabel) {
        return (
            <RightText color="textDisabled">
                <Translation id="moduleTrading.notSelected" />
            </RightText>
        );
    }

    if (!selectedAddress) {
        return <RightText color="textSubdued">{selectedAccountLabel}</RightText>;
    }

    return (
        <>
            <RightText color="textSubdued">{selectedAccountLabel}</RightText>
            <AccountAddress
                address={selectedAddress}
                form="short"
                color="textSubdued"
                variant="hint"
                textAlign="right"
            />
        </>
    );
};

export const ReceiveAccountPicker = () => {
    const { translate } = useTranslate();
    const navigation = useNavigation<NavigationProps>();
    const selectedReceiveAccount = useSelector(selectBuySelectedReceiveAccount);
    const form = useTradingBuyFormContext();

    const selectedSymbol = getSelectedSymbolFromBuyForm(form);

    if (!selectedSymbol) {
        return null;
    }

    const openAccountPicker = () =>
        navigation.navigate(TradingStackRoutes.ReceiveAccounts, { symbol: selectedSymbol });

    const addressText =
        (selectedReceiveAccount?.account.addresses
            ? selectedReceiveAccount?.address?.address
            : selectedReceiveAccount?.account.descriptor) ?? '';

    return (
        <TradingOverviewRow
            title={translate('moduleTrading.tradingScreen.receiveAccount')}
            onPress={openAccountPicker}
            noBottomBorder
        >
            <VStack spacing={0} paddingLeft="sp20">
                <ReceiveAccountPickerRight
                    selectedAccountLabel={selectedReceiveAccount?.account.accountLabel}
                    selectedAddress={addressText}
                />
            </VStack>
        </TradingOverviewRow>
    );
};
