import { ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { Text, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    RootStackParamList,
    StackToStackCompositeNavigationProps,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { Color } from '@trezor/theme';

import { selectBuySelectedReceiveAccount } from '../../tradingSlice';
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
    selectedSymbol: NetworkSymbol | undefined;
};
export type NavigationProps = StackToStackCompositeNavigationProps<
    TradingStackParamList,
    TradingStackRoutes.ReceiveAccounts,
    RootStackParamList
>;

export type ReceiveAccountPickerProps = {
    selectedSymbol?: NetworkSymbol;
};

const RightText = ({ color, variant = 'body', children }: RightTextProps) => (
    <Text color={color} variant={variant} textAlign="right" ellipsizeMode="tail" numberOfLines={1}>
        {children}
    </Text>
);

const ReceiveAccountPickerRight = ({
    selectedAccountLabel,
    selectedAddress,
    selectedSymbol,
}: ReceiveAccountPickerRightProps) => {
    if (!selectedSymbol) {
        return (
            <RightText color="textDisabled">
                <Translation id="moduleTrading.selectCoinFirst" />
            </RightText>
        );
    }

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

export const ReceiveAccountPicker = ({ selectedSymbol }: ReceiveAccountPickerProps) => {
    const { translate } = useTranslate();
    const navigation = useNavigation<NavigationProps>();
    const selectedReceiveAccount = useSelector(selectBuySelectedReceiveAccount);

    const openAccountPicker = () =>
        selectedSymbol &&
        navigation.navigate(TradingStackRoutes.ReceiveAccounts, { symbol: selectedSymbol });

    const onPress = selectedSymbol ? openAccountPicker : undefined;

    const addressText =
        (selectedReceiveAccount?.account.addresses
            ? selectedReceiveAccount?.address?.address
            : selectedReceiveAccount?.account.descriptor) ?? '';

    return (
        <TradingOverviewRow
            title={translate('moduleTrading.tradingScreen.receiveAccount')}
            onPress={onPress}
            noBottomBorder
        >
            <VStack spacing={0} paddingLeft="sp20">
                <ReceiveAccountPickerRight
                    selectedAccountLabel={selectedReceiveAccount?.account.accountLabel}
                    selectedAddress={addressText}
                    selectedSymbol={selectedSymbol}
                />
            </VStack>
        </TradingOverviewRow>
    );
};
