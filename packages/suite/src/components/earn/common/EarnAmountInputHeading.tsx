import { type ComponentProps, type ReactNode } from 'react';

import { Row, Text } from '@trezor/components';

type EarnAmountInputHeadingProps = {
    label: ReactNode;
    labelTestId?: string;
    gap: ComponentProps<typeof Row>['gap'];
    currencySwitch?: ReactNode;
};

export const EarnAmountInputHeading = ({
    label,
    labelTestId,
    gap,
    currencySwitch,
}: EarnAmountInputHeadingProps) => (
    <Row justifyContent="space-between" alignItems="center" gap={gap}>
        <Text typographyStyle="body-md" data-testid={labelTestId}>
            {label}
        </Text>
        {currencySwitch}
    </Row>
);
