import React from 'react';
import { useSelector } from 'react-redux';

import { atom, useAtom } from 'jotai';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Divider } from '@suite-native/atoms';
import { CryptoIcon } from '@trezor/icons';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { emptyGraphPoint, EnhancedGraphPointWithCryptoBalance } from '@suite-native/graph';
import { CryptoAmountFormatter, FiatAmountFormatter } from '@suite-native/formatters';

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
    const [selectedPoint] = useAtom(selectedPointAtom);

    if (!account) return null;

    return (
        <Box>
            <Box marginBottom="large" justifyContent="center" alignItems="center">
                <Box flexDirection="row" alignItems="center" marginBottom="small">
                    <Box style={applyStyle(cryptoIconStyle)}>
                        <CryptoIcon name={account.symbol} />
                    </Box>
                    <CryptoAmountFormatter
                        value={selectedPoint.cryptoBalance}
                        network={account.symbol}
                    />
                </Box>
                <Box>
                    <FiatAmountFormatter
                        value={selectedPoint.value}
                        network={account.symbol}
                        variant="titleLarge"
                    />
                </Box>
            </Box>
            <Box marginBottom="large">
                <Divider />
            </Box>
        </Box>
    );
};
