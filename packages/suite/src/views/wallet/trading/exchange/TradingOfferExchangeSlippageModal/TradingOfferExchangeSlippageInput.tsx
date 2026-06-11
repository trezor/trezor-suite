import { Controller, useFormContext } from 'react-hook-form';

import { SLIPPAGE_PRESETS, type SlippageFormValues } from '@suite-common/trading';
import { Column, FractionButton, Icon, Input, Row } from '@trezor/components';
import { decimalTransformer } from '@trezor/utils';

export const TradingOfferExchangeSlippageInput = () => {
    const { control, setValue } = useFormContext<SlippageFormValues>();

    const handlePresetClick = (preset: string) => {
        setValue('slippage', preset, { shouldValidate: true });
    };

    return (
        <Column gap={8}>
            <Controller
                name="slippage"
                control={control}
                render={({ field: { onChange, ...field }, fieldState: { error } }) => (
                    <Input
                        {...field}
                        onChange={event => onChange(decimalTransformer(event.target.value))}
                        data-testid="@trading/slippage-modal/input"
                        hasError={!!error}
                        bottomText={error?.message || null}
                        rightContent={<Icon name="percent" />}
                    />
                )}
            />

            <Row gap={2}>
                {SLIPPAGE_PRESETS.map(preset => (
                    <FractionButton
                        key={preset}
                        id={preset}
                        onClick={() => handlePresetClick(preset)}
                    >
                        {preset}%
                    </FractionButton>
                ))}
            </Row>
        </Column>
    );
};
