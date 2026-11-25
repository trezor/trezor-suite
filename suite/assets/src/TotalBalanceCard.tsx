import { type ReactNode } from 'react';

import { Card, Column, Row, Skeleton, Text } from '@trezor/components';

/** The line height of the total headline, so what stands in for it keeps the card from jumping. */
const TOTAL_BALANCE_HEIGHT = 56;

type TotalBalanceCardProps = {
    label: ReactNode;
    /** Shown opposite the label. */
    labelAside?: ReactNode;
    /** The total is not known yet, so a placeholder takes the place of the content. */
    isLoading?: boolean;
    /** Fills the height the card is given, the label small at the top and the total at the bottom. */
    isStretched?: boolean;
    /** The total headline and whatever goes under it. */
    children?: ReactNode;
    actions?: ReactNode;
    'data-testid'?: string;
};

/** The card a total balance sits in: on Home, on Earn and on an account's overview. */
export const TotalBalanceCard = ({
    label,
    labelAside,
    isLoading = false,
    isStretched = false,
    children,
    actions,
    'data-testid': dataTestId,
}: TotalBalanceCardProps) => {
    const labelTypographyStyle = isStretched ? 'body-sm' : 'body-md';

    const content = (
        <Column
            alignItems={isStretched ? 'stretch' : 'flex-start'}
            gap={isStretched ? 24 : 8}
            height={isStretched ? '100%' : undefined}
            justifyContent={isStretched ? 'space-between' : undefined}
        >
            <Row justifyContent="space-between" alignItems="center" gap={8}>
                <Text typographyStyle={labelTypographyStyle} intent="neutral" priority="secondary">
                    {label}
                </Text>
                {labelAside !== undefined && (
                    <Text
                        typographyStyle={labelTypographyStyle}
                        intent="neutral"
                        priority="secondary"
                    >
                        {labelAside}
                    </Text>
                )}
            </Row>
            {isLoading ? (
                <Row data-testid={dataTestId === undefined ? undefined : `${dataTestId}/skeleton`}>
                    <Skeleton width={180} height={TOTAL_BALANCE_HEIGHT} />
                </Row>
            ) : (
                children
            )}
        </Column>
    );

    return (
        <Card height={isStretched ? '100%' : undefined} data-testid={dataTestId}>
            {actions === undefined ? (
                content
            ) : (
                <Row alignItems="center" justifyContent="space-between">
                    {content}
                    {actions}
                </Row>
            )}
        </Card>
    );
};
