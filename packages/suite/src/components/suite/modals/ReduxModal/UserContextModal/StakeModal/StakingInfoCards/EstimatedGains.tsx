import React from 'react';
import { selectPoolStatsApyData, StakeRootState } from '@suite-common/wallet-core';
import { Column, Grid, H2, Image, Paragraph, Text } from '@trezor/components';
import { useSelector } from 'react-redux';
import { Translation } from 'src/components/suite/Translation';
import { useStakeEthFormContext } from 'src/hooks/wallet/useStakeEthForm';
import { CRYPTO_INPUT } from 'src/types/wallet/stakeForms';
import { FiatValue, FormattedCryptoAmount, TrezorLink } from 'src/components/suite';
import styled, { useTheme } from 'styled-components';
import { spacings, spacingsPx } from '@trezor/theme';
import { calculateGains } from 'src/utils/suite/stake';
import { HELP_CENTER_ETH_STAKING } from '@trezor/urls';

const Heading = styled.div`
    margin-bottom: ${spacingsPx.xl};
`;

const ImageWrapper = styled.div`
    margin-top: -${spacingsPx.xxxxl};
    width: 100%;
`;

export const EstimatedGains = () => {
    const { account, getValues, formState } = useStakeEthFormContext();

    const theme = useTheme();

    const value = getValues(CRYPTO_INPUT);
    const hasInvalidFormState =
        Object.keys(formState.errors).length > 0 &&
        formState.errors[CRYPTO_INPUT]?.type !== 'reserveOrBalance'; // provide gains calculation even if the user has not enough balance

    const cryptoInput = hasInvalidFormState || !value ? '0' : value;

    const ethApy = useSelector((state: StakeRootState) =>
        selectPoolStatsApyData(state, account?.symbol),
    );

    const gains = [
        {
            label: <Translation id="TR_STAKE_WEEKLY" />,
            value: calculateGains(cryptoInput, ethApy, 52),
        },
        {
            label: <Translation id="TR_STAKE_MONTHLY" />,
            value: calculateGains(cryptoInput, ethApy, 12),
        },
        {
            label: <Translation id="TR_STAKE_YEARLY" />,
            value: calculateGains(cryptoInput, ethApy, 1),
        },
    ];

    return (
        <>
            <Heading>
                <H2 typographyStyle="titleMedium" color="iconPrimaryDefault">
                    {ethApy}%
                </H2>
                <Paragraph typographyStyle="hint" variant="tertiary">
                    <Translation id="TR_STAKE_APY_ABBR" />
                </Paragraph>
                <ImageWrapper>
                    <Image image="GAINS_GRAPH" width="100%" />
                </ImageWrapper>
            </Heading>
            <Column gap={spacings.md} alignItems="normal">
                {gains.map(({ label, value }, index) => (
                    <Grid key={index} columns={3}>
                        <Paragraph typographyStyle="body" variant="tertiary">
                            {label}
                        </Paragraph>
                        <Text color={theme.textPrimaryDefault}>
                            <FormattedCryptoAmount value={value} symbol={account.symbol} />
                        </Text>

                        <Paragraph align="right">
                            <FiatValue amount={value} symbol={account.symbol} />
                        </Paragraph>
                    </Grid>
                ))}
                <Paragraph typographyStyle="body" variant="tertiary" align="center">
                    <Translation
                        id="TR_STAKING_YOUR_EARNINGS"
                        values={{
                            a: chunks => (
                                <TrezorLink href={HELP_CENTER_ETH_STAKING}>{chunks}</TrezorLink>
                            ),
                        }}
                    />
                </Paragraph>
            </Column>
        </>
    );
};
