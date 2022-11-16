import React from 'react';
import { useSelector } from 'react-redux';

import { atom, useAtom } from 'jotai';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Divider, Text } from '@suite-native/atoms';
import { CryptoIcon } from '@trezor/icons';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { useFormatters } from '@suite-common/formatters';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { ExtendedGraphPoint, LineGraphPoint } from '@suite-common/wallet-graph';

type AccountBalanceProps = {
    accountKey: string;
};

const cryptoIconStyle = prepareNativeStyle(utils => ({
    marginRight: utils.spacings.small / 2,
}));

const selectedPointAtom = atom<ExtendedGraphPoint>({
    value: 0,
    date: new Date(),
    originalDate: new Date(),
});

// reference is usually first point, same as Revolut does in their app
const referencePointAtom = atom<ExtendedGraphPoint>({
    value: 0,
    date: new Date(),
    originalDate: new Date(),
});

export const writeOnlySelectedPointAtom = atom<null, ExtendedGraphPoint | LineGraphPoint>(
    null, // it's a convention to pass `null` for the first argument
    (_get, set, updatedPoint) => {
        // LineGraphPoint should never happen, but we need it to satisfy typescript because of originalDate
        set(selectedPointAtom, updatedPoint as ExtendedGraphPoint);
    },
);
export const writeOnlyReferencePointAtom = atom<null, ExtendedGraphPoint>(
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
    const { FiatAmountFormatter, CryptoAmountFormatter } = useFormatters();

    if (!account) return null;

    // TODO this should be done with formatters once they're prepared
    const cryptoAmount = formatNetworkAmount(account.availableBalance, account.symbol);

    return (
        <Box>
            <Box marginBottom="large" justifyContent="center" alignItems="center">
                <Box flexDirection="row" alignItems="center" marginBottom="small">
                    <Box style={applyStyle(cryptoIconStyle)}>
                        <CryptoIcon name={account.symbol} />
                    </Box>
                    <Text color="gray600" variant="hint">
                        {CryptoAmountFormatter.format(cryptoAmount, {
                            symbol: account.symbol,
                        })}
                    </Text>
                </Box>
                <Box>
                    <Text variant="titleLarge" color="gray800">
                        <FiatAmountFormatter value={selectedPoint.value} />
                    </Text>
                </Box>
            </Box>
            <Box marginBottom="large">
                <Divider />
            </Box>
        </Box>
    );
};
