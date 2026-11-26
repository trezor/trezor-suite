import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { Button, Row, Text } from '@trezor/components';

type EarnAmountInputAddonProps = {
    unit: ReactNode;
    onMaxClick?: () => void;
    maxButtonTestId: string;
    'data-testid'?: string;
};

export const EarnAmountInputAddon = ({
    unit,
    onMaxClick,
    maxButtonTestId,
    'data-testid': dataTestId,
}: EarnAmountInputAddonProps) => (
    <Row alignItems="center" gap={8}>
        <Text
            typographyStyle="body-md"
            intent="neutral"
            priority="secondary"
            data-testid={dataTestId}
        >
            {unit}
        </Text>
        {onMaxClick && (
            <Button
                type="button"
                size="small"
                intent="neutral"
                priority="secondary"
                data-testid={maxButtonTestId}
                onClick={onMaxClick}
            >
                <Translation id="TR_FRACTION_BUTTONS_MAX" />
            </Button>
        )}
    </Row>
);
