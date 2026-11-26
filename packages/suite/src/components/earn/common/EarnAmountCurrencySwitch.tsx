import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { TextButton } from '@trezor/components';

type EarnAmountCurrencySwitchProps = {
    currency: ReactNode;
    onClick: () => void;
    isUnderlined?: boolean;
    'data-testid': string;
};

export const EarnAmountCurrencySwitch = ({
    currency,
    onClick,
    isUnderlined,
    'data-testid': testId,
}: EarnAmountCurrencySwitchProps) => (
    <TextButton
        type="button"
        size="small"
        onClick={onClick}
        isUnderlined={isUnderlined}
        data-testid={testId}
    >
        <Translation id="TR_ENTER_AMOUNT_IN" values={{ currency }} />
    </TextButton>
);
