import { Translation, type TranslationKey } from '@suite/intl';
import { Row, Text, Tooltip } from '@trezor/components';

export interface TronResourceBreakdownRowProps {
    label: TranslationKey;
    value: number;
    tooltip?: TranslationKey;
    isDeduction?: boolean;
}

export const TronResourceBreakdownRow = ({
    label,
    value,
    tooltip,
    isDeduction,
}: TronResourceBreakdownRowProps) => {
    const labelText = (
        <Text typographyStyle="body-md" intent="neutral" priority="secondary">
            <Translation id={label} />
        </Text>
    );

    return (
        <Row justifyContent="space-between">
            {tooltip ? (
                <Tooltip hasIcon content={<Translation id={tooltip} />}>
                    {labelText}
                </Tooltip>
            ) : (
                labelText
            )}
            <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                {isDeduction && value > 0 ? `-${value}` : value}
            </Text>
        </Row>
    );
};
