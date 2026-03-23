import { type ReactNode } from 'react';

import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { InfoItem, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { TradingFiatAmount } from '../../TradingFiatAmount';

type TradingFiatAmountInfoItemProps = {
    amount?: string;
    currency?: string;
    disableHiddenPlaceholder?: boolean;
    label: ReactNode;
};

export const TradingFiatAmountInfoItem = ({
    amount,
    currency,
    disableHiddenPlaceholder,
    label,
}: TradingFiatAmountInfoItemProps) => {
    const fiatAmount =
        amount && amount.trim() !== '' ? asBaseCurrencyAmount(new BigNumber(amount)) : undefined;

    return (
        <InfoItem label={label} direction="row">
            <Text typographyStyle="body-sm" as="div" data-testid="@trading/form/info/fiat-amount">
                <TradingFiatAmount
                    amount={fiatAmount}
                    currency={currency}
                    disableHiddenPlaceholder={disableHiddenPlaceholder}
                />
            </Text>
        </InfoItem>
    );
};
