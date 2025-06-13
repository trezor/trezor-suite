import { ReactNode } from 'react';

import { useNavigation } from '@react-navigation/native';

import { TradingType } from '@suite-common/trading';
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

import { ReceiveAccount } from '../../../types/general';
import { AccountAddress } from '../AccountAddress';
import { OverviewRow } from '../OverviewRow';

export type ReceiveAccountPickerProps = {
    symbol: NetworkSymbol | undefined;
    receiveAccount: ReceiveAccount | undefined;
    tradingType: Exclude<TradingType, 'sell'>;
    testID?: string;
};

type RightTextProps = {
    children: ReactNode;
    color: Color;
    variant?: 'body' | 'hint';
    testID?: string;
};

type ReceiveAccountPickerRightProps = {
    accountLabel: string | undefined;
    addressText: string | undefined;
    testID?: string;
};

export type NavigationProps = StackToStackCompositeNavigationProps<
    TradingStackParamList,
    TradingStackRoutes.ReceiveAccounts,
    RootStackParamList
>;

const RightText = ({ color, variant = 'body', testID, children }: RightTextProps) => (
    <Text
        color={color}
        variant={variant}
        testID={testID}
        textAlign="right"
        ellipsizeMode="tail"
        numberOfLines={1}
    >
        {children}
    </Text>
);

const ReceiveAccountPickerRight = ({
    accountLabel,
    addressText,
    testID,
}: ReceiveAccountPickerRightProps) => {
    if (accountLabel == null) {
        return (
            <RightText color="textSubdued" testID={testID ? `${testID}/not-selected` : undefined}>
                <Translation id="moduleTrading.notSelected" />
            </RightText>
        );
    }

    if (!addressText) {
        return (
            <RightText
                color="textSubdued"
                testID={testID ? `${testID}/selected-account` : undefined}
            >
                {accountLabel}
            </RightText>
        );
    }

    return (
        <>
            <RightText
                color="textSubdued"
                testID={testID ? `${testID}/selected-account` : undefined}
            >
                {accountLabel}
            </RightText>
            <AccountAddress
                address={addressText}
                form="short"
                color="textSubdued"
                variant="hint"
                textAlign="right"
            />
        </>
    );
};

export const ReceiveAccountPicker = ({
    receiveAccount,
    symbol,
    tradingType,
    testID,
}: ReceiveAccountPickerProps) => {
    const { translate } = useTranslate();
    const navigation = useNavigation<NavigationProps>();

    if (!symbol) {
        return null;
    }

    const openAccountPicker = () =>
        navigation.navigate(TradingStackRoutes.ReceiveAccounts, { symbol, tradingType });

    const accountLabel = receiveAccount?.account.accountLabel;
    const addressText =
        (receiveAccount?.account.addresses
            ? receiveAccount?.address?.address
            : receiveAccount?.account.descriptor) ?? '';

    return (
        <OverviewRow
            title={translate('moduleTrading.tradingScreen.receiveAccount')}
            onPress={openAccountPicker}
            testID={testID}
            noBottomBorder
        >
            <VStack spacing={0} paddingLeft="sp20">
                <ReceiveAccountPickerRight
                    accountLabel={accountLabel}
                    addressText={addressText}
                    testID={testID}
                />
            </VStack>
        </OverviewRow>
    );
};
