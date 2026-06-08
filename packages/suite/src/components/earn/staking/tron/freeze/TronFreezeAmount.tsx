import { useFormState } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { formInputsMaxLength } from '@suite-common/validators';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { Banner, Button, Column, Row, Text } from '@trezor/components';
import { NumberInput } from '@trezor/product-components';
import { BigNumber } from '@trezor/utils';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { useSelector } from 'src/hooks/suite';

import { useTronStakeContext } from '../TronStakeContext';

export const TronFreezeAmount = () => {
    const locale = useSelector(selectLanguage);
    const { account, form, actions } = useTronStakeContext();
    const { control } = form.methods;
    const { errors } = useFormState({ control });
    const isDisabled = !!actions.pendingTxid;

    const availableBalance = subunitsToUnits({
        value: asAmountSubunit(new BigNumber(account.availableBalance)),
        symbol: account.symbol,
    }).toString();

    return (
        <Column gap={8}>
            <Text typographyStyle="body-md">
                <Translation id="AMOUNT" />
            </Text>
            <NumberInput
                name="amount"
                locale={locale}
                control={control}
                rules={form.amountRules}
                maxLength={formInputsMaxLength.amount}
                isDisabled={isDisabled}
                rightContent={
                    <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                        {getNetworkDisplaySymbol(account.symbol)}
                    </Text>
                }
            />
            <Row justifyContent="space-between" alignItems="center" gap={8}>
                <Row alignItems="center" gap={8}>
                    <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                        <Translation id="TR_STAKE_AVAILABLE" />
                        {': '}
                        <FormattedCryptoAmount value={availableBalance} symbol={account.symbol} />
                    </Text>
                    <Button
                        type="button"
                        size="small"
                        intent="neutral"
                        priority="secondary"
                        onClick={actions.setMax}
                        isDisabled={isDisabled}
                    >
                        <Translation id="TR_FRACTION_BUTTONS_MAX" />
                    </Button>
                </Row>
                <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                    <BaseCurrencyValue
                        amount={availableBalance}
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
