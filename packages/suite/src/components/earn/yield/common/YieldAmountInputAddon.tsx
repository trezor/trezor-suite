import { Translation } from '@suite/intl';
import { Button, Row, Text } from '@trezor/components';

type YieldAmountInputAddonProps = {
    unit: string;
    onMaxClick?: () => void;
    'data-testid'?: string;
};

export const YieldAmountInputAddon = ({
    unit,
    onMaxClick,
    'data-testid': dataTestId,
}: YieldAmountInputAddonProps) => (
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
                data-testid="@yield/form/max-button"
                onClick={onMaxClick}
            >
                <Translation id="TR_FRACTION_BUTTONS_MAX" />
            </Button>
        )}
    </Row>
);
