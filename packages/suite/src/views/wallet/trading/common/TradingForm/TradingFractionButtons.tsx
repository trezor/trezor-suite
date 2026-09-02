import { useMemo } from 'react';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { FractionButton, Row } from '@trezor/components';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { isTradingSellContext } from 'src/utils/wallet/trading/tradingTypingUtils';

import { generateFractionButtons } from './tradingFormInputsUtils';

export const TradingFractionButtons = () => {
    const context = useTradingFormContext<'sell' | 'exchange'>();
    const { analytics } = useServices(selectDesktopAnalyticsDep);

    const analyticsType = isTradingSellContext(context) ? 'sell' : 'swap';
    const fractionButtons = useMemo(
        () => generateFractionButtons(context.form.helpers),
        [context.form.helpers],
    );

    return (
        <Row gap={8} data-testid="@trading/form/fraction-buttons">
            {fractionButtons.map(button => {
                const { percentValue, onClick, ...buttonProps } = button;

                return (
                    <FractionButton
                        key={buttonProps.id}
                        {...buttonProps}
                        onClick={() => {
                            analytics.report({
                                type: events.appFormPercentButtonsEvent.name,
                                payload: { type: analyticsType, value: percentValue },
                            });
                            onClick();
                        }}
                    />
                );
            })}
        </Row>
    );
};
