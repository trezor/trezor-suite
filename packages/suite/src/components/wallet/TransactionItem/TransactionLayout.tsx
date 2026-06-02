import { type ReactNode } from 'react';

import { Card, Column, Flex, Grid, InfoSegments, Row, Text } from '@trezor/components';

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
    const { isBelowLaptop, isBelowTablet } = useLayoutSize();

    return (
        <Card onClick={onClick} paddingType="none">
            <Flex
                gap={isBelowLaptop ? 12 : 24}
                padding={{ vertical: 20, horizontal: 24 }}
                alignItems="flex-start"
                direction={isBelowLaptop ? 'column' : 'row'}
                flexWrap="nowrap"
            >
                {icon}
                <Column flex="1" gap={6} width="100%">
                    <Row justifyContent="space-between" gap={24}>
                        <InfoSegments intent="neutral" priority="secondary">
                            <Text typographyStyle="body-md-strong" intent="neutral" as="div">
                                {heading}
                            </Text>
                            <Text typographyStyle="body-md" isDisabled as="div">
                                {timestamp}
                            </Text>
                        </InfoSegments>
                    </Row>

                    <Grid
                        columns={
                            isBelowTablet
                                ? '1fr max-content'
                                : '1fr max-content minmax(110px, max-content)'
                        }
                        rowGap={isBelowTablet ? 12 : 4}
                        columnGap={24}
                        flex="1"
                    >
                        {children}
                    </Grid>
                    {actions}
                </Column>
            </Flex>
        </Card>
    );
};
