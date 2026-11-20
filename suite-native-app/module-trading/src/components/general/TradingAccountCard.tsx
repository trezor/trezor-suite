import type { ReactNode } from 'react';
import { FadeIn } from 'react-native-reanimated';

import type { CryptoId } from 'invity-api';

import type { Account } from '@suite-common/wallet-types';
import { AnimatedBox, Box, BoxSkeleton } from '@suite-native/atoms';
import { NetworkAndAccountCard } from '@suite-native/trading-atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { CryptoAmountRow } from './CryptoAmountRow';

export type TradingAccountCardProps = {
    account: Account | undefined;
    title: ReactNode;
    amount: string | undefined;
    direction: 'from' | 'to';
    cryptoId: CryptoId | undefined;
    isAmountLoading?: boolean;
};

const AMOUNT_SKELETON_HEIGHT = 24;
const AMOUNT_SKELETON_WIDTH = 136;

const rowStyle = prepareNativeStyle(({ spacings, colors, borders }) => ({
    paddingVertical: spacings.sp12,
    paddingHorizontal: spacings.sp16,
    borderTopColor: colors.borderNeutral,
    borderTopWidth: borders.widths.small,
}));

export const TradingAccountCard = ({
    account,
    title,
    amount,
    direction,
    cryptoId,
    isAmountLoading = false,
}: TradingAccountCardProps) => {
    const { applyStyle } = useNativeStyles();

    if (!account || !cryptoId) {
        return null;
    }

    return (
        <NetworkAndAccountCard title={title} account={account}>
            {isAmountLoading ? (
                <Box style={applyStyle(rowStyle)}>
                    <BoxSkeleton height={AMOUNT_SKELETON_HEIGHT} width={AMOUNT_SKELETON_WIDTH} />
                </Box>
            ) : (
                <AnimatedBox entering={FadeIn}>
                    <CryptoAmountRow
                        cryptoId={cryptoId}
                        amount={amount}
                        direction={direction}
                        style={applyStyle(rowStyle)}
                    />
                </AnimatedBox>
            )}
        </NetworkAndAccountCard>
    );
};
