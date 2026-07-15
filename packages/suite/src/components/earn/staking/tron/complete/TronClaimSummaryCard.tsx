import { Translation } from '@suite/intl';
import { Card, Column, Divider, Icon, Row, Text } from '@trezor/components';
import { CheckCircleFilledIcon } from '@trezor/icons';
import { CoinLogo } from '@trezor/product-components';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

import { useTronStakeContext } from '../TronStakeContext';
import { TronStakeInfoRow } from '../TronStakeInfoRow';

export const TronClaimSummaryCard = () => {
    const { account, form } = useTronStakeContext();
    const { amount } = form.methods.getValues();

    return (
        <Card type="contrast" paddingType="none">
            <Column gap={0}>
                <TronStakeInfoRow label={<Translation id="TR_EARN_YIELD_STATUS" />}>
                    <Row alignItems="center" gap={8}>
                        <Icon as={CheckCircleFilledIcon} intent="brand" />
                        <Text typographyStyle="body-md" intent="brand">
                            <Translation id="TR_EARN_YIELD_COMPLETED" />
                        </Text>
                    </Row>
                </TronStakeInfoRow>

                <Divider color="borderNeutral" margin={0} />

                <TronStakeInfoRow label={<Translation id="TR_EARN_TRON_CLAIMED" />}>
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
            </Column>
        </Card>
    );
};
