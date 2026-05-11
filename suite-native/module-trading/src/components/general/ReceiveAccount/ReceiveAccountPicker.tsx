import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { type TradingType } from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Text, VStack } from '@suite-native/atoms';
import { AddressFormatter } from '@suite-native/formatters';
import { Translation, useTranslate } from '@suite-native/intl';
import { type CombinedLabelingState, selectAccountLabel } from '@suite-native/labeling';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
    type TradingStackParamList,
    type TradingStackRoutes,
} from '@suite-native/navigation';
import { OverviewRow } from '@suite-native/trading-atoms';
import { type ReceiveAccount } from '@suite-native/trading-types';
import { type Color } from '@trezor/theme';

import { getReceiveAccountAddressText } from '../../../utils/general/receiveAccountUtils';

export type ReceiveAccountPickerProps = {
    symbol: NetworkSymbol | undefined;
    receiveAccount: ReceiveAccount | undefined;
    tradingType: Exclude<TradingType, 'sell'>;
    testID?: string;
    noBottomBorder?: boolean;
};

type RightTextProps = {
    children: ReactNode;
    color: Color;
    variant?: 'body-md' | 'body-sm';
    testID?: string;
};

type ReceiveAccountPickerRightProps = {
    accountLabel: string | undefined;
    addressText: string | undefined;
    testID?: string;
};

export type NavigationProps = StackToStackCompositeNavigationProps<
    TradingStackParamList,
    TradingStackRoutes.Trading,
    RootStackParamList
>;

const RightText = ({ color, variant = 'body-sm', testID, children }: RightTextProps) => (
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
            <RightText
                color="contentSecondary"
                testID={testID ? `${testID}/not-selected` : undefined}
            >
                <Translation id="moduleTrading.notSelected" />
            </RightText>
        );
    }

    if (!addressText) {
        return (
            <RightText
                color="contentSecondary"
                testID={testID ? `${testID}/selected-account` : undefined}
            >
                {accountLabel}
            </RightText>
        );
    }

    return (
        <>
            <RightText
                color="contentSecondary"
                testID={testID ? `${testID}/selected-account` : undefined}
            >
                {accountLabel}
            </RightText>
            <AddressFormatter
                value={addressText}
                format="short"
                color="contentSecondary"
                variant="body-sm"
                textAlign="right"
            />
        </>
    );
};

export const ReceiveAccountPicker = ({
    receiveAccount,
    symbol,
    tradingType,
    noBottomBorder = true,
    testID,
}: ReceiveAccountPickerProps) => {
    const { translate } = useTranslate();
    const navigation = useNavigation<NavigationProps>();

    const account = receiveAccount?.account;

    const accountLabel = useSelector((state: CombinedLabelingState) =>
        account !== undefined
            ? (selectAccountLabel(state, account.deviceState, account.descriptor, account.symbol) ??
              '') // important to be `''` there is logic that relays on it
            : undefined,
    );

    if (!symbol) {
        return null;
    }

    const openAccountPicker = () =>
        navigation.navigate(RootStackRoutes.ReceiveAccounts, { symbol, tradingType });

    const addressText = getReceiveAccountAddressText(receiveAccount) ?? '';

    return (
        <OverviewRow
            title={translate('moduleTrading.tradingScreen.receiveAccount')}
            onPress={openAccountPicker}
            testID={testID}
            noBottomBorder={noBottomBorder}
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
