import { Account } from '@suite-common/wallet-types';
import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { Column, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { BigNumber } from '@trezor/utils';

import { AccountLabel } from 'src/components/suite/AccountLabel';
import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

import { AssetRowAccountDataProps } from '../../../constants';
import { AssetImage } from '../AssetImage';
import { ItemClickableContainer } from '../ItemClickableContainer';

type AssetRowAccountProps = Pick<AssetRowAccountDataProps, 'account'> & {
    'data-testid'?: string;
    onClick: (account: Account) => void;
};

export function AssetRowAccount({
    'data-testid': dataTestId,
    account,
    onClick,
}: AssetRowAccountProps) {
    const accountBalance = subunitsToUnits({
        value: asAmountSubunit(new BigNumber(account.balance)),
        symbol: account.symbol,
    });

    return (
        <ItemClickableContainer onClick={() => onClick(account)}>
            <Row data-testid={dataTestId} gap={spacings.sm} alignItems="center">
                <AssetImage
                    size={40}
                    symbol={account.symbol}
                    networkSymbol={account.symbol}
                    coingeckoId={account.networkType}
                />
                <Text variant="default" typographyStyle="body">
                    <AccountLabel
                        account={account}
                        accountTypeBadgeSize="medium"
                        showAccountTypeBadge
                    />
                </Text>
            </Row>

            <Column alignItems="flex-end">
                <Text variant="default" typographyStyle="body">
                    <FormattedCryptoAmount
                        symbol={account.symbol}
                        value={accountBalance}
                        isBalance
                    />
                </Text>
                <Text variant="tertiary" typographyStyle="hint">
                    <BaseCurrencyValue
                        symbol={account.symbol}
                        amount={accountBalance}
                        fiatAmountFormatterOptions={{
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                        }}
                    />
                </Text>
            </Column>
        </ItemClickableContainer>
    );
}
