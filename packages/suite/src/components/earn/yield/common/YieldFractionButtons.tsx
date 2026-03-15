import { Translation } from '@suite/intl';
import { FractionButton, Row } from '@trezor/components';

import { getYieldFractionAmount, normalizeAmountToTokenDecimals } from './yieldAmountUtils';

type YieldFractionButtonsProps = {
    maxAmount: string;
    decimals: number;
    isDisabled?: boolean;
    onFractionClick: (amount: string) => void;
};

export const YieldFractionButtons = ({
    maxAmount,
    decimals,
    isDisabled = false,
    onFractionClick,
}: YieldFractionButtonsProps) => (
    <Row gap={8}>
        <FractionButton
            id="TR_FRACTION_BUTTONS_10_PERCENT"
            isDisabled={isDisabled}
            onClick={() => onFractionClick(getYieldFractionAmount(maxAmount, 10, decimals))}
        >
            <Translation id="TR_FRACTION_BUTTONS_10_PERCENT" />
        </FractionButton>
        <FractionButton
            id="TR_FRACTION_BUTTONS_25_PERCENT"
            isDisabled={isDisabled}
            onClick={() => onFractionClick(getYieldFractionAmount(maxAmount, 25, decimals))}
        >
            <Translation id="TR_FRACTION_BUTTONS_25_PERCENT" />
        </FractionButton>
        <FractionButton
            id="TR_FRACTION_BUTTONS_50_PERCENT"
            isDisabled={isDisabled}
            onClick={() => onFractionClick(getYieldFractionAmount(maxAmount, 50, decimals))}
        >
            <Translation id="TR_FRACTION_BUTTONS_50_PERCENT" />
        </FractionButton>
        <FractionButton
            id="TR_FRACTION_BUTTONS_MAX"
            isDisabled={isDisabled}
            onClick={() => onFractionClick(normalizeAmountToTokenDecimals(maxAmount, decimals))}
        >
            <Translation id="TR_FRACTION_BUTTONS_MAX" />
        </FractionButton>
    </Row>
);
