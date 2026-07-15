import { Translation } from '@suite/intl';
import { getTronWithdrawableBalance } from '@suite-common/wallet-utils';
import { Card, Column, Row, Text } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

import { useTronStakeContext } from '../TronStakeContext';
import { TronStakeInfoRow } from '../TronStakeInfoRow';

export const TronWithdrawAmount = () => {
    const { account } = useTronStakeContext();
    const amount = getTronWithdrawableBalance(account);

    return (
        <Card paddingType="none">
            <TronStakeInfoRow label={<Translation id="AMOUNT" />}>
                <Row alignItems="center" gap={8}>
                    <CoinLogo symbol={account.symbol} size={24} />
                    <Column gap={2} alignItems="flex-end">
                        <Text typographyStyle="body-md-strong">
                            <FormattedCryptoAmount value={amount} symbol={account.symbol} />
                        </Text>
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <BaseCurrencyValue
                                amount={amount}
                                symbol={account.symbol}
                                showApproximationIndicator
                            />
                        </Text>
                    </Column>
                </Row>
            </TronStakeInfoRow>
        </Card>
    );
};
