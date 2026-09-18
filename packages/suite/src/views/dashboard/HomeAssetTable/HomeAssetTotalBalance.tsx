import styled from 'styled-components';

import { selectLanguage } from '@suite/settings';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { Row, Text } from '@trezor/components';
import { type BigNumber } from '@trezor/utils';

import { HiddenPlaceholder } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

const TabularNumbers = styled.span`
    font-variant-numeric: tabular-nums;
`;

type HomeAssetTotalBalanceProps = {
    fiatValue: BigNumber;
};

export const HomeAssetTotalBalance = ({ fiatValue }: HomeAssetTotalBalanceProps) => {
    const locale = useSelector(selectLanguage);
    const currency = useSelector(selectBaseCurrency);

    const parts = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency.toUpperCase(),
    }).formatToParts(fiatValue.toNumber());

    const partsOf = (...types: Intl.NumberFormatPartTypes[]) =>
        parts
            .filter(part => types.includes(part.type))
            .map(part => part.value)
            .join('');

    const currencySymbol = partsOf('currency', 'literal');
    const whole = partsOf('integer', 'group');
    const decimals = partsOf('decimal', 'fraction');

    return (
        <HiddenPlaceholder enforceIntensity={10}>
            <Row alignItems="baseline" data-testid="@dashboard/home-asset/fiat-amount">
                {currencySymbol !== '' && (
                    <Text typographyStyle="headline-lg" color="contentTertiary">
                        {currencySymbol}
                    </Text>
                )}
                <Text typographyStyle="headline-lg">
                    <TabularNumbers>{whole}</TabularNumbers>
                </Text>
                {decimals !== '' && (
                    <Text typographyStyle="headline-lg" color="contentTertiary">
                        <TabularNumbers>{decimals}</TabularNumbers>
                    </Text>
                )}
            </Row>
        </HiddenPlaceholder>
    );
};
