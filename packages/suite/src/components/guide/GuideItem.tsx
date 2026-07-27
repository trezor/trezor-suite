import { type ReactNode } from 'react';

import { Card, Paragraph, Row } from '@trezor/components';

type GuideItemProps = {
    onClick?: () => void;
    'data-testid': string;
    icon?: ReactNode;
    children: ReactNode;
};

export const GuideItem = ({
    onClick,
    'data-testid': dataTestId,
    icon,
    children,
}: GuideItemProps) => (
    <Card data-testid={dataTestId} onClick={onClick} paddingType="small">
        <Row gap={16}>
            {icon}
            <Paragraph typographyStyle="body-md" flex="1">
                {children}
            </Paragraph>
        </Row>
    </Card>
);
