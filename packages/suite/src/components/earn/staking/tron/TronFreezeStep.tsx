import { Translation, type TranslationKey } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { formInputsMaxLength } from '@suite-common/validators';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    TRON_RESOURCE_TYPES,
    type TronResourceType,
    getResourceGain,
} from '@suite-common/wallet-core';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import {
    Banner,
    Button,
    Card,
    Column,
    Divider,
    Icon,
    Row,
    SelectBar,
    Text,
    Tooltip,
} from '@trezor/components';
import { NumberInput } from '@trezor/product-components';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { useSelector } from 'src/hooks/suite';

import { useTronStakeContext } from './TronStakeContext';

const RESOURCE_LABEL: Record<TronResourceType, TranslationKey> = {
    bandwidth: 'TR_EARN_TRON_BANDWIDTH',
    energy: 'TR_EARN_TRON_ENERGY',
};

export const TronFreezeStep = () => {
    const locale = useSelector(selectLanguage);
    const { account, form } = useTronStakeContext();
    const { methods, amountRules } = form;
    const {
        control,
        setValue,
        watch,
        formState: { errors },
    } = methods;

    const amount = watch('amount');
    const resourceType = watch('resourceType');

    const tronResources = account.networkType === 'tron' ? account.misc.tronResources : undefined;

    const availableBalance = formatNetworkAmount(account.availableBalance, account.symbol);

    const resourceOptions = TRON_RESOURCE_TYPES.map(type => {
        const gain = getResourceGain(amount, type, tronResources);

        return {
            value: type,
            label: (
                <Translation
                    id={RESOURCE_LABEL[type]}
                    values={{ count: gain !== null ? Math.round(gain) : 0 }}
                />
            ),
        };
    });

    return (
        <Column gap={16}>
            <Card paddingType="none">
                <Column gap={16} padding={{ vertical: 16, horizontal: 20 }}>
                    <Column gap={8}>
                        <Text typographyStyle="body-md">
                            <Translation id="AMOUNT" />
                        </Text>
                        <NumberInput
                            name="amount"
                            locale={locale}
                            control={control}
                            rules={amountRules}
                            maxLength={formInputsMaxLength.amount}
                            rightContent={
                                <Text
                                    typographyStyle="body-md"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    {getNetworkDisplaySymbol(account.symbol)}
                                </Text>
                            }
                        />
                        <Row justifyContent="space-between" alignItems="center" gap={8}>
                            <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                                <Translation id="TR_STAKE_AVAILABLE" />
                                {': '}
                                <FormattedCryptoAmount
                                    value={availableBalance}
                                    symbol={account.symbol}
                                />
                            </Text>
                            <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                                <BaseCurrencyValue
                                    amount={availableBalance}
                                    symbol={account.symbol}
                                    showApproximationIndicator
                                />
                            </Text>
                        </Row>
                        {errors.amount?.message && (
                            <Banner
                                intent="warning"
                                description={<Text>{errors.amount.message}</Text>}
                            />
                        )}
                    </Column>

                    <Divider margin={{ top: 0, bottom: 0 }} />

                    <Column gap={8}>
                        <Row gap={4} alignItems="center">
                            <Text typographyStyle="body-md">
                                <Translation id="TR_EARN_TRON_RESOURCE_TO_EARN" />
                            </Text>
                            <Tooltip
                                content={<Translation id="TR_EARN_TRON_RESOURCE_TO_EARN_TOOLTIP" />}
                            >
                                <Icon name="info" size={16} />
                            </Tooltip>
                        </Row>

                        <SelectBar
                            options={resourceOptions}
                            selectedOption={resourceType}
                            onChange={(value: TronResourceType) => setValue('resourceType', value)}
                        />
                    </Column>
                </Column>
            </Card>

            <Card />

            <Button size="large" width="100%" isDisabled>
                <Translation id="TR_CONTINUE" />
            </Button>
        </Column>
    );
};
