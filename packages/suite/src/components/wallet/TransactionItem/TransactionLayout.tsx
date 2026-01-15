import { ReactNode } from 'react';

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
    const { isBelowLaptop } = useLayoutSize();

    return (
        <Card onClick={onClick} paddingType="none">
            <Row gap={24} padding={{ vertical: 20, horizontal: 24 }}>
                {icon}
                <Column flex="1" gap={8}>
                    <Row justifyContent="space-between" gap={24}>
                        <InfoSegments variant="disabled" typographyStyle="body">
                            <Text variant="default" as="div">
                                {heading}
                            </Text>
                            {timestamp}
                        </InfoSegments>
                        {actions}
                    </Row>

                    <Grid
                        columns={
                            isBelowLaptop
                                ? '1fr max-content'
                                : '1fr max-content minmax(110px, max-content)'
                        }
                        rowGap={isBelowLaptop ? 12 : 6}
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
