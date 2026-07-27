import { type ReactNode } from 'react';

import { Card, Column, H4, Icon, type IconComponent, Paragraph, Row } from '@trezor/components';

type OnboardingOptionProps = {
    heading: ReactNode;
    onClick: () => void;
    description?: ReactNode;
    icon?: IconComponent;
    'data-testid'?: string;
};

export const OnboardingOption = ({
    icon,
    heading,
    description,
    onClick,
    'data-testid': dataTestId,
}: OnboardingOptionProps) => (
    <Card onClick={onClick} data-testid={dataTestId} paddingType="none" type="contrast">
        <Row
            gap={20}
            justifyContent={icon ? 'flex-start' : 'center'}
            padding={{ vertical: 20, horizontal: 32 }}
        >
            {icon && <Icon as={icon} size={48} />}
            <Column gap={2}>
                <H4>{heading}</H4>
                {description && (
                    <Paragraph
                        typographyStyle="body-sm"
                        intent="neutral"
                        priority="secondary"
                        textWrap="pretty"
                    >
                        {description}
                    </Paragraph>
                )}
            </Column>
        </Row>
    </Card>
);
