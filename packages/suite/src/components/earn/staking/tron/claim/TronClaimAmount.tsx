import { Translation } from '@suite/intl';
import { getTronStakingRewards } from '@suite-common/wallet-utils';
import { Card, Column, Row, Text } from '@trezor/components';
import { TokenIcon } from '@trezor/product-components';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

import { useTronStakeContext } from '../TronStakeContext';
import { TronStakeInfoRow } from '../TronStakeInfoRow';

export const TronClaimAmount = () => {
    const { account, form } = useTronStakeContext();
    const snapshotAmount = form.methods.watch('amount');
    const reward = snapshotAmount || getTronStakingRewards(account);

    return (
        <Card paddingType="none">
            <TronStakeInfoRow label={<Translation id="AMOUNT" />}>
                <Row alignItems="center" gap={8}>
                    <TokenIcon symbol={account.symbol} size={24} />
                    <Column gap={2} alignItems="flex-end">
                        <Text typographyStyle="body-md-strong">
                            <FormattedCryptoAmount value={reward} symbol={account.symbol} />
                        </Text>
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <BaseCurrencyValue
                                amount={reward}
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
