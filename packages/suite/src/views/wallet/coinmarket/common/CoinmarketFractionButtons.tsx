import { Button, Row } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { spacings } from '@trezor/theme';

interface CoinmarketFractionButtonsProps {
    onFractionClick: (divisor: number) => void;
    onAllClick: () => void;
    disabled?: boolean;
    className?: string;
}

export const CoinmarketFractionButtons = ({
    disabled,
    onFractionClick,
    onAllClick,
}: CoinmarketFractionButtonsProps) => {
    const buttons = [
        { label: '1/4', value: 4 },
        { label: '1/3', value: 3 },
        { label: '1/2', value: 2 },
        { label: <Translation id="TR_FRACTION_BUTTONS_ALL" />, value: null },
    ];

    return (
        <Row data-testid="@coinmarket/form/fraction-buttons">
            {buttons.map((button, index) => (
                <Button
                    variant="tertiary"
                    type="button"
                    size="small"
                    margin={{ right: spacings.sm }}
                    key={index}
                    isDisabled={disabled}
                    onClick={() => (!button.value ? onAllClick() : onFractionClick(button.value))}
                >
                    {button.label}
                </Button>
            ))}
        </Row>
    );
};
