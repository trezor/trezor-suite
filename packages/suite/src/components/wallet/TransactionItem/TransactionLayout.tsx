import { type ReactNode } from 'react';

import { Card, Column, Grid, InfoSegments, Row, Text } from '@trezor/components';

import { useLayoutSize } from 'src/hooks/suite';

type TransactionLayoutProps = {
    timestamp: ReactNode;
    heading: ReactNode;
    icon: ReactNode;
    children: ReactNode;
    onClick?: () => void;
    actions?: ReactNode;
};

export const TransactionLayout = ({
    onClick,
    heading,
    timestamp,
    actions,
    icon,
    children,
}: TransactionLayoutProps) => {
    const { isBelowLaptop, isAboveMobile } = useLayoutSize();

    return (
        <Card onClick={onClick} paddingType="none">
            <Row gap={24} padding={{ vertical: 20, horizontal: 24 }}>
                {isAboveMobile && icon}
                <Column flex="1" gap={6}>
                    <Row justifyContent="space-between" gap={24}>
                        <InfoSegments intent="neutral" priority="secondary">
                            <Text typographyStyle="body-md-strong" intent="neutral" as="div">
                                {heading}
                            </Text>
                            <Text typographyStyle="body-md" isDisabled as="div">
                                {timestamp}
                            </Text>
                        </InfoSegments>
                        {actions}
                    </Row>

                    <Grid
                        columns={
                            isBelowLaptop
                                ? '1fr max-content'
                                : '1fr max-content minmax(110px, max-content)'
                        }
                        rowGap={isBelowLaptop ? 12 : 4}
                        columnGap={24}
                        flex="1"
                    >
                        {children}
                    </Grid>
                </Column>
            </Row>
        </Card>
    );
};
