import { useFormState, useWatch } from 'react-hook-form';

import { Translation, useTranslation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { formInputsMaxLength } from '@suite-common/validators';
import { getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { Banner, Button, Column, Row, Text } from '@trezor/components';
import { NumberInput } from '@trezor/product-components';
import { BigNumber } from '@trezor/utils';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { useSelector } from 'src/hooks/suite';
import { validateDecimals, validateMin } from 'src/utils/suite/validation';

import { useTronStakeContext } from '../TronStakeContext';
import { getStakedBalance } from './unstakeUtils';

export const TronUnstakeAmount = () => {
    const locale = useSelector(selectLanguage);
    const { translationString } = useTranslation();
    const { account, form, actions } = useTronStakeContext();
    const { control, setValue } = form.methods;
    const { errors } = useFormState({ control });
    const isDisabled = !!actions.pendingTxid;

    const resourceType = useWatch({ control, name: 'resourceType' });
    const stakedBalance = getStakedBalance(account, resourceType);

    const amountRules = {
        required: translationString('AMOUNT_IS_NOT_SET'),
        validate: {
            min: validateMin(translationString),
            decimals: validateDecimals(translationString, {
                decimals: getNetwork(account.symbol).decimals,
            }),
            staked: (value: string) =>
                new BigNumber(value || 0).lte(stakedBalance) ||
                translationString('TR_EARN_TRON_UNSTAKE_AMOUNT_EXCEEDS_STAKED'),
        },
    };

    return (
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
                isDisabled={isDisabled}
                hasError={!!errors.amount}
                rightContent={
                    <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                        {getNetworkDisplaySymbol(account.symbol)}
                    </Text>
                }
            />
            <Row justifyContent="space-between" alignItems="center" gap={8}>
                <Row alignItems="center" gap={8}>
                    <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                        <Translation id="TR_EARN_TRON_STAKED" />{' '}
                        <FormattedCryptoAmount value={stakedBalance} symbol={account.symbol} />
                    </Text>
                    <Button
                        type="button"
                        size="small"
                        intent="neutral"
                        priority="secondary"
                        onClick={() => setValue('amount', stakedBalance, { shouldValidate: true })}
                        isDisabled={isDisabled}
                    >
                        <Translation id="TR_FRACTION_BUTTONS_MAX" />
                    </Button>
                </Row>
                <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                    <BaseCurrencyValue
                        amount={stakedBalance}
                        symbol={account.symbol}
                        showApproximationIndicator
                    />
                </Text>
            </Row>
            {errors.amount?.message && (
                <Banner intent="warning" description={<Text>{errors.amount.message}</Text>} />
            )}
        </Column>
    );
};
