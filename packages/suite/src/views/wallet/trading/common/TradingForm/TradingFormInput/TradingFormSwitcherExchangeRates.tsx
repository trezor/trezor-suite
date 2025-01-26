import { UseFormSetValue } from 'react-hook-form';

import styled from 'styled-components';

import { Radio, Column, Card, Grid, Paragraph, useElevation } from '@trezor/components';
import { borders, spacingsPx, spacings, Elevation, mapElevationToBackground } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { CoinmarketExchangeFormProps, RateType } from 'src/types/coinmarket/coinmarketForm';
import {
    FORM_RATE_FIXED,
    FORM_RATE_FLOATING,
    FORM_RATE_TYPE,
} from 'src/constants/wallet/coinmarket/form';
import { TranslationKey } from 'src/components/suite/Translation';

const ItemWrapper = styled.div<{ $isSelected: boolean; $elevation: Elevation }>`
    padding: ${spacingsPx.sm} ${spacingsPx.md};
    border-radius: ${borders.radii.sm};
    background: ${mapElevationToBackground};

    ${({ $isSelected }) => !$isSelected && 'background: none;'}
`;

type ItemProps = {
    isSelected: boolean;
    onClick: () => void;
    title: TranslationKey;
    label: TranslationKey;
};

const Item = ({ isSelected, onClick, title, label }: ItemProps) => {
    const { elevation } = useElevation();

    return (
        <ItemWrapper $isSelected={isSelected} $elevation={elevation}>
            <Radio labelAlignment="left" isChecked={isSelected} onClick={onClick}>
                <Column alignItems="flex-start" gap={spacings.xxxs}>
                    <Paragraph variant={isSelected ? 'default' : 'disabled'}>
                        <Translation id={title} />
                    </Paragraph>
                    <Paragraph
                        typographyStyle="hint"
                        variant={isSelected ? 'tertiary' : 'disabled'}
                    >
                        <Translation id={label} />
                    </Paragraph>
                </Column>
            </Radio>
        </ItemWrapper>
    );
};

type CoinmarketFormSwitcherExchangeRatesProps = {
    rateType: RateType;
    setValue: UseFormSetValue<CoinmarketExchangeFormProps>;
};

export const CoinmarketFormSwitcherExchangeRates = ({
    rateType,
    setValue,
}: CoinmarketFormSwitcherExchangeRatesProps) => {
    const floatingRateSelected = rateType === FORM_RATE_FLOATING;

    return (
        <Column gap={spacings.xs}>
            <Translation id="TR_COINMARKET_RATE" />
            <Card paddingType="none">
                <Grid
                    columns={2}
                    margin={{ vertical: spacings.xs, horizontal: spacings.xs }}
                    gap={spacings.xs}
                >
                    <Item
                        isSelected={!floatingRateSelected}
                        onClick={() => setValue(FORM_RATE_TYPE, FORM_RATE_FIXED)}
                        title="TR_COINMARKET_FIX_RATE"
                        label="TR_COINMARKET_FIX_RATE_DESCRIPTION"
                    />
                    <Item
                        isSelected={floatingRateSelected}
                        onClick={() => setValue(FORM_RATE_TYPE, FORM_RATE_FLOATING)}
                        title="TR_COINMARKET_FLOATING_RATE"
                        label="TR_COINMARKET_FLOATING_RATE_DESCRIPTION"
                    />
                </Grid>
            </Card>
        </Column>
    );
};
