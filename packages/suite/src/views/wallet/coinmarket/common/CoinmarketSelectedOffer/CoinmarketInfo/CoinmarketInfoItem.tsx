import { Account } from '@suite-common/wallet-types';
import { Column, Row } from '@trezor/components';
import { spacingsPx, typography } from '@trezor/theme';
import { AccountLabeling, Translation } from 'src/components/suite';
import { CoinmarketPayGetLabelType, CoinmarketTradeType } from 'src/types/coinmarket/coinmarket';
import {
    CoinmarketInfoAmount,
    CoinmarketInfoLeftColumn,
    CoinmarketInfoRightColumn,
} from 'src/views/wallet/coinmarket';
import { CoinmarketCoinImage } from 'src/views/wallet/coinmarket/common/CoinmarketCoinImage';
import { CoinmarketCryptoAmount } from 'src/views/wallet/coinmarket/common/CoinmarketCryptoAmount';
import { CoinmarketFiatAmount } from 'src/views/wallet/coinmarket/common/CoinmarketFiatAmount';
import styled from 'styled-components';

const AccountLabel = styled.div`
    ${typography.label}
    color: ${({ theme }) => theme.textSubdued};
    width: 100%;
    padding-top: ${spacingsPx.xxs};
`;

const AccountTypeLabel = styled.div`
    padding-left: ${spacingsPx.xxs};
`;

interface CoinmarketInfoItemProps {
    account?: Account;
    type: CoinmarketTradeType;
    label: CoinmarketPayGetLabelType;
    currency?: string;
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
    <Row alignItems="center" justifyContent="space-between">
        <CoinmarketInfoLeftColumn>
            <Translation id={label} />
        </CoinmarketInfoLeftColumn>
        <CoinmarketInfoRightColumn>
            {type === 'exchange' || isReceive ? (
                <Column>
                    <Row alignItems="center">
                        <CoinmarketCoinImage symbol={currency} />
                        <CoinmarketInfoAmount>
                            <CoinmarketCryptoAmount amount={amount} symbol={currency} />
                        </CoinmarketInfoAmount>
                    </Row>
                    {account && (
                        <AccountLabel>
                            <Row justifyContent="flex-end">
                                <AccountLabeling account={account} />
                                <AccountTypeLabel>
                                    {account.accountType !== 'normal'
                                        ? `(${account.accountType})`
                                        : ''}
                                </AccountTypeLabel>
                            </Row>
                        </AccountLabel>
                    )}
                </Column>
            ) : (
                <CoinmarketFiatAmount amount={amount} currency={currency} />
            )}
        </CoinmarketInfoRightColumn>
    </Row>
);
