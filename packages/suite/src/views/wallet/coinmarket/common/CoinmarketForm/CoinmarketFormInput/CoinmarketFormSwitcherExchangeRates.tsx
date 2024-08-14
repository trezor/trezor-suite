import styled, { css } from 'styled-components';
import { Radio } from '@trezor/components';
import { variables } from '@trezor/components/src/config';
import { Translation } from 'src/components/suite';
import { borders, spacingsPx } from '@trezor/theme';
import CoinmarketFormInputLabel from './CoinmarketFormInputLabel';
import { CoinmarketExchangeFormProps, RateType } from 'src/types/coinmarket/coinmarketForm';
import { UseFormSetValue } from 'react-hook-form';

const RadioItems = styled.div`
    display: flex;
    padding: ${spacingsPx.xxs};
    gap: ${spacingsPx.xxs};
    border-radius: ${borders.radii.md};
    background-color: ${({ theme }) => theme.backgroundSurfaceElevation2};
`;

const RadioItem = styled.div<{ $isSelected: boolean }>`
    flex: 1;
    padding: ${spacingsPx.sm} ${spacingsPx.md};
    border-radius: ${borders.radii.sm};

    .header {
        margin-bottom: ${spacingsPx.xxs};
        color: ${({ theme }) => theme.textDefault};
    }

    .description {
        font-size: ${variables.FONT_SIZE.SMALL};
        color: ${({ theme }) => theme.textSubdued};
    }

    ${({ $isSelected }) =>
        $isSelected
            ? css`
                  background-color: ${({ theme }) => theme.backgroundSurfaceElevation1};
              `
            : css`
                  .header,
                  .description {
                      color: ${({ theme }) => theme.textDisabled};
                  }
              `}
`;

interface CoinmarketFormSwitcherExchangeRatesProps {
    rateType: RateType;
    setValue: UseFormSetValue<CoinmarketExchangeFormProps>;
}

const CoinmarketFormSwitcherExchangeRates = ({
    rateType,
    setValue,
}: CoinmarketFormSwitcherExchangeRatesProps) => {
    const floatingRateSelected = rateType === 'floating';

    return (
        <>
            <CoinmarketFormInputLabel label="TR_COINMARKET_RATE" />
            <RadioItems>
                <RadioItem $isSelected={!floatingRateSelected}>
                    <Radio
                        labelAlignment="left"
                        isChecked={!floatingRateSelected}
                        onClick={() => setValue('rateType', 'fixed')}
                    >
                        <div>
                            <div className="header">
                                <Translation id="TR_COINMARKET_FIX_RATE" />
                            </div>
                            <div className="description">
                                <Translation id="TR_COINMARKET_FIX_RATE_DESCRIPTION" />
                            </div>
                        </div>
                    </Radio>
                </RadioItem>
                <RadioItem $isSelected={floatingRateSelected}>
                    <Radio
                        labelAlignment="left"
                        isChecked={floatingRateSelected}
                        onClick={() => setValue('rateType', 'floating')}
                    >
                        <div>
                            <div className="header">
                                <Translation id="TR_COINMARKET_FLOATING_RATE" />
                            </div>
                            <div className="description">
                                <Translation id="TR_COINMARKET_FLOATING_RATE_DESCRIPTION" />
                            </div>
                        </div>
                    </Radio>
                </RadioItem>
            </RadioItems>
        </>
    );
};

export default CoinmarketFormSwitcherExchangeRates;
