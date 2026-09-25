import { useMemo } from 'react';
import { type UseFormReturn } from 'react-hook-form';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { TRADING_FORM_AMOUNT_INPUT_SOURCE } from '@suite-common/trading';
import { Row, TextButton } from '@trezor/components';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { type TradingAllFormProps } from 'src/types/trading/tradingForm';
import { isTradingSellContext } from 'src/utils/wallet/trading/tradingTypingUtils';

import { generateFractionButtons } from './tradingFormInputsUtils';

export const TradingFractionButtons = () => {
    const context = useTradingFormContext<'sell' | 'exchange'>();
    const { setValue } = context as UseFormReturn<TradingAllFormProps>;
    const { analytics } = useServices(injectDesktopAnalytics);

    const analyticsType = isTradingSellContext(context) ? 'sell' : 'swap';
    const fractionButtons = useMemo(
        () => generateFractionButtons(context.form.helpers),
        [context.form.helpers],
    );

    return (
        <Row gap={12} data-testid="@trading/form/fraction-buttons">
            {fractionButtons.map(({ id, children, isDisabled, percentValue, onClick }) => (
                <TextButton
                    key={id}
                    intent="brand"
                    size="small"
                    isUnderlined
                    isDisabled={isDisabled}
                    onClick={() => {
                        analytics.report({
                            type: events.appFormPercentButtonsEvent.name,
                            payload: { type: analyticsType, value: percentValue },
                        });
                        setValue(TRADING_FORM_AMOUNT_INPUT_SOURCE, 'fraction');
                        onClick();
                    }}
                >
                    {children}
                </TextButton>
            ))}
        </Row>
    );
};
