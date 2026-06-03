import type { ReactNode } from 'react';

import type { CryptoId } from 'invity-api';

import type { Account } from '@suite-common/wallet-types';
import { NetworkAndAccountCard } from '@suite-native/trading-atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { CryptoAmountRow } from '../../general/CryptoAmountRow';

export type ExchangeAccountCardProps = {
    account: Account | undefined;
    title: ReactNode;
    amount: string | undefined;
    direction: 'from' | 'to';
    cryptoId: CryptoId | undefined;
};

const rowStyle = prepareNativeStyle(({ spacings, colors, borders }) => ({
    paddingVertical: spacings.sp12,
    paddingHorizontal: spacings.sp16,
    borderTopColor: colors.borderNeutral,
    borderTopWidth: borders.widths.small,
}));

export const ExchangeAccountCard = ({
    account,
    title,
    amount,
    direction,
    cryptoId,
}: ExchangeAccountCardProps) => {
    const { applyStyle } = useNativeStyles();

    if (!account || !cryptoId) {
        return null;
    }

    return (
        <NetworkAndAccountCard title={title} account={account}>
            <CryptoAmountRow
                cryptoId={cryptoId}
                amount={amount}
                direction={direction}
                style={applyStyle(rowStyle)}
            />
        </NetworkAndAccountCard>
    );
};
