import { CryptoId } from 'invity-api';

import type { TradingType } from '@suite-common/trading';
import { Account } from '@suite-common/wallet-types';
import { Column, InfoItem, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { AccountLabeling, Translation } from 'src/components/suite';
import { TradingPayGetLabelType } from 'src/types/trading/trading';
import { TradingCoinLogo } from 'src/views/wallet/trading/common/TradingCoinLogo';
import { TradingCryptoAmount } from 'src/views/wallet/trading/common/TradingCryptoAmount';
import { TradingFiatAmount } from 'src/views/wallet/trading/common/TradingFiatAmount';

interface TradingInfoItemProps {
    account?: Account;
    type: TradingType;
    label: TradingPayGetLabelType;
    currency?: CryptoId;
    amount?: string;
    isReceive?: boolean;
}

export const TradingInfoItem = ({
    account,
    type,
    isReceive,
    label,
    currency,
    amount,
}: TradingInfoItemProps) => (
    <InfoItem label={<Translation id={label} />} direction="row">
        {type === 'exchange' || isReceive ? (
            <Column alignItems="flex-end" gap={spacings.xxxs}>
                <Row gap={spacings.xs}>
                    {currency && (
                        <>
                            <TradingCoinLogo cryptoId={currency} size={20} />
                            <TradingCryptoAmount amount={amount} cryptoId={currency} />
                        </>
                    )}
                </Row>
                {account && (
                    <Text variant="tertiary" typographyStyle="label" as="div">
                        <Row gap={spacings.xxs}>
                            <AccountLabeling account={account} />
                            {account.accountType !== 'normal' ? `(${account.accountType})` : ''}
                        </Row>
                    </Text>
                )}
            </Column>
        ) : (
            <Row data-testid="@trading/form/info/fiat-amount">
                <TradingFiatAmount amount={amount} currency={currency} />
            </Row>
        )}
    </InfoItem>
);
