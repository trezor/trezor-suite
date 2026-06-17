import { Translation, type TranslationKey } from '@suite/intl';
import { type TronResourceType } from '@suite-common/wallet-types';
import { getResourceGain } from '@suite-common/wallet-utils';
import { Card, Column, Divider, Icon, Row, Text } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

import { useTronStakeContext } from '../TronStakeContext';
import { TronStakeInfoRow } from '../TronStakeInfoRow';
import { getCurrentResource } from '../unstake/unstakeUtils';

const REDUCTION_LABEL: Record<TronResourceType, TranslationKey> = {
    bandwidth: 'TR_EARN_TRON_BANDWIDTH_REDUCTION',
    energy: 'TR_EARN_TRON_ENERGY_REDUCTION',
};

export const TronUnstakeSummaryCard = () => {
    const { account, form } = useTronStakeContext();

    if (account.networkType !== 'tron') {
        return null;
    }

    const { amount, resourceType } = form.methods.getValues();

    const { tronResources } = account.misc;
    const gain = getResourceGain(amount, resourceType, tronResources);
    const reduction = Math.min(
        gain !== null ? Math.round(gain) : 0,
        getCurrentResource(account, resourceType),
    );

    return (
        <Card type="contrast" paddingType="none">
            <Column gap={0}>
                <TronStakeInfoRow label={<Translation id="TR_EARN_YIELD_STATUS" />}>
                    <Row alignItems="center" gap={8}>
                        <Icon name="checkCircleFilled" intent="brand" />
                        <Text typographyStyle="body-md" intent="brand">
                            <Translation id="TR_EARN_YIELD_COMPLETED" />
                        </Text>
                    </Row>
                </TronStakeInfoRow>

                <Divider color="borderNeutral" margin={0} />

                <TronStakeInfoRow label={<Translation id="TR_EARN_TRON_UNSTAKED" />}>
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

                <Divider color="borderNeutral" margin={0} />

                <TronStakeInfoRow label={<Translation id="TR_EARN_TRON_RESOURCE_REDUCTION" />}>
                    <Text typographyStyle="body-md">
                        <Translation
                            id={REDUCTION_LABEL[resourceType]}
                            values={{ count: reduction }}
                        />
                    </Text>
                </TronStakeInfoRow>
            </Column>
        </Card>
    );
};
