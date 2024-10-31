import { Account } from '@suite-common/wallet-types';
import { Column, Row, InfoRow, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { CryptoId } from 'invity-api';
import { AccountLabeling, Translation } from 'src/components/suite';
import { CoinmarketPayGetLabelType, CoinmarketTradeType } from 'src/types/coinmarket/coinmarket';
import { CoinmarketCoinLogo } from 'src/views/wallet/coinmarket/common/CoinmarketCoinLogo';
import { CoinmarketCryptoAmount } from 'src/views/wallet/coinmarket/common/CoinmarketCryptoAmount';
import { CoinmarketFiatAmount } from 'src/views/wallet/coinmarket/common/CoinmarketFiatAmount';

interface CoinmarketInfoItemProps {
    account?: Account;
    type: CoinmarketTradeType;
    label: CoinmarketPayGetLabelType;
    currency?: CryptoId;
    amount?: string;
    isReceive?: boolean;
}

export const CoinmarketInfoItem = ({
    account,
    type,
    isReceive,
    label,
    currency,
    amount,
}: CoinmarketInfoItemProps) => (
    <InfoRow label={<Translation id={label} />} direction="row">
        {type === 'exchange' || isReceive ? (
            <Column alignItems="flex-end" gap={spacings.xxxs}>
                <Row gap={spacings.xs}>
                    <CoinmarketCoinLogo cryptoId={currency!} size={20} />
                    <CoinmarketCryptoAmount amount={amount} cryptoId={currency!} />
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
            <Row data-testid="@coinmarket/form/info/fiat-amount">
                <CoinmarketFiatAmount amount={amount} currency={currency} />
            </Row>
        )}
    </InfoRow>
);
