import React from 'react';
import { useSelector } from 'react-redux';

import { atom, useAtom } from 'jotai';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, DiscreetText, Divider } from '@suite-native/atoms';
import { CryptoIcon } from '@trezor/icons';
import {
    AccountsRootState,
    selectAccountByKey,
    selectIsTestnetAccount,
} from '@suite-common/wallet-core';
import { useFormatters } from '@suite-common/formatters';
import { emptyGraphPoint, EnhancedGraphPointWithCryptoBalance } from '@suite-native/graph';

type AccountBalanceProps = {
    accountKey: string;
};

const cryptoIconStyle = prepareNativeStyle(utils => ({
    marginRight: utils.spacings.small / 2,
}));

const selectedPointAtom = atom<EnhancedGraphPointWithCryptoBalance>(emptyGraphPoint);

// reference is usually first point, same as Revolut does in their app
const referencePointAtom = atom<EnhancedGraphPointWithCryptoBalance>(emptyGraphPoint);

export const writeOnlySelectedPointAtom = atom<null, EnhancedGraphPointWithCryptoBalance>(
    null, // it's a convention to pass `null` for the first argument
    (_get, set, updatedPoint) => {
        set(selectedPointAtom, updatedPoint);
    },
);
export const writeOnlyReferencePointAtom = atom<null, EnhancedGraphPointWithCryptoBalance>(
    null,
    (_get, set, updatedPoint) => {
        set(referencePointAtom, updatedPoint);
    },
);

export const AccountBalance = ({ accountKey }: AccountBalanceProps) => {
    const { applyStyle } = useNativeStyles();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const isTestnetAccount = useSelector((state: AccountsRootState) =>
        selectIsTestnetAccount(state, accountKey),
    );
    const [selectedPoint] = useAtom(selectedPointAtom);
    const { FiatAmountFormatter, CryptoAmountFormatter } = useFormatters();

    if (!account) return null;

    return (
        <Box>
            <Box marginBottom="large" justifyContent="center" alignItems="center">
                <Box flexDirection="row" alignItems="center" marginBottom="small">
                    <Box style={applyStyle(cryptoIconStyle)}>
                        <CryptoIcon name={account.symbol} />
                    </Box>
                    <DiscreetText color="gray600" typography="hint">
                        {CryptoAmountFormatter.format(selectedPoint.cryptoBalance, {
                            symbol: account.symbol,
                            isBalance: true,
                        })}
                    </DiscreetText>
                </Box>
                <Box>
                    <DiscreetText typography="titleLarge" color="gray800">
                        {isTestnetAccount ? null : FiatAmountFormatter.format(selectedPoint.value)}
                    </DiscreetText>
                </Box>
            </Box>
            <Box marginBottom="large">
                <Divider />
            </Box>
        </Box>
    );
};
