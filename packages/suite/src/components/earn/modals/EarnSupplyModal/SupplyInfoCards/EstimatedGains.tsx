import React, { useMemo } from 'react';

import { Translation } from '@suite/intl';
import { calculateGains, getNetworkAdjustedStakingBalance } from '@suite-common/staking';
import { selectPoolStatsApyData } from '@suite-common/wallet-core';
import { Column, Grid, Image, Paragraph, Text } from '@trezor/components';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { TrezorLink } from 'src/components/suite/TrezorLink';
import { useSupplyFormContext } from 'src/hooks/earn/useSupplyForm';
import { useSelector } from 'src/hooks/suite';
import { CRYPTO_INPUT } from 'src/types/earn/earnFormFields';

import { getStakingHelpCenterLink } from '../../../utils/getStakingHelpCenterLink';

export const EstimatedGains = () => {
    const { account, getValues, formState } = useSupplyFormContext();

    const value = getValues(CRYPTO_INPUT);
    const hasInvalidFormState =
        Object.keys(formState.errors).length > 0 &&
        formState.errors[CRYPTO_INPUT]?.type !== 'reserveOrBalance'; // provide gains calculation even if the user has not enough balance

    const cryptoInput = useMemo(() => {
        if (account.networkType === 'cardano') {
            return getNetworkAdjustedStakingBalance(account.formattedBalance, account) ?? '0';
        }

        if (!hasInvalidFormState && value) {
            return value;
        }

        return '0';
    }, [hasInvalidFormState, value, account]);

    const apy = useSelector(state => selectPoolStatsApyData(state, account));

    const gains = [
        {
            label: <Translation id="TR_STAKE_WEEKLY" />,
            value: calculateGains(cryptoInput, apy, 365 / 52),
        },
        {
            label: <Translation id="TR_STAKE_MONTHLY" />,
            value: calculateGains(cryptoInput, apy, 365 / 12),
        },
        {
            label: <Translation id="TR_STAKE_YEARLY" />,
            value: calculateGains(cryptoInput, apy, 365),
        },
    ];

    const learnMoreLink = useMemo(
        () => getStakingHelpCenterLink(account.networkType),
        [account.networkType],
    );

    return (
        <Column gap={20}>
            <Column>
                <Paragraph intent="brand" typographyStyle="headline-md">
                    {apy}%
                </Paragraph>
                <Paragraph
                    typographyStyle="body-sm"
                    intent="neutral"
                    priority="secondary"
                    margin={{ bottom: -48 }}
                >
                    <Translation id="TR_STAKE_APY_ABBR" />
                </Paragraph>
                <Image image="GAINS_GRAPH" width="100%" />
            </Column>
            <Column gap={12} hasDivider>
                {gains.map(({ label, value }, index) => (
                    <Grid key={index} columns={3}>
                        <Paragraph intent="neutral" priority="secondary">
                            {label}
                        </Paragraph>
                        <Text intent="brand">
                            <FormattedCryptoAmount value={value} symbol={account.symbol} />
                        </Text>
                        <Paragraph align="end">
                            <BaseCurrencyValue amount={value} symbol={account.symbol} />
                        </Paragraph>
                    </Grid>
                ))}
            </Column>
            <Paragraph intent="neutral" priority="secondary">
                <Translation
                    id="TR_STAKING_YOUR_EARNINGS"
                    values={{
                        a: chunks => <TrezorLink href={learnMoreLink}>{chunks}</TrezorLink>,
                    }}
                />
            </Paragraph>
        </Column>
    );
};
