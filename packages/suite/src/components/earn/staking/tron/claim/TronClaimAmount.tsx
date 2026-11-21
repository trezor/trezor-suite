import { Translation } from '@suite/intl';
import { formatStakingAmount, useStakingAccountPosition } from '@suite-common/earn-staking';
import { Card, Column, Row, Text } from '@trezor/components';
import { TokenIcon } from '@trezor/product-components';

import { BaseCurrencyValue } from '#src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';

import { useTronStakeContext } from '../TronStakeContext';
import { TronStakeInfoRow } from '../TronStakeInfoRow';

export const TronClaimAmount = () => {
    // React Compiler: `watch` keeps one identity for the form's whole life, so a compiled
    // render-time read of it freezes on the first render. Remove once these reads move to
    // `useWatch` or out of render.
    'use no memo';

    const { account, form } = useTronStakeContext();
    const snapshotAmount = form.methods.watch('amount');

    const { totals } = useStakingAccountPosition(account.key);

    const reward =
        snapshotAmount ||
        formatStakingAmount({ amount: totals.rewards, networkSymbol: account.symbol });

    return (
        <Card paddingType="none">
            <TronStakeInfoRow label={<Translation id="AMOUNT" />}>
                <Row alignItems="center" gap={8}>
                    <TokenIcon networkSymbol={account.symbol} size={24} />
                    <Column gap={2} alignItems="flex-end">
                        <Text
                            typographyStyle="body-md-strong"
                            data-testid="@staking/tron-claim/amount"
                        >
                            <FormattedCryptoAmount value={reward} networkSymbol={account.symbol} />
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
