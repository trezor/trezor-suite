import { type ReactNode } from 'react';

import { Card, Column, H4, Icon, type IconName, Paragraph, Row } from '@trezor/components';

type OnboardingOptionProps = {
    heading: ReactNode;
    onClick: () => void;
    description?: ReactNode;
    iconName?: IconName;
    'data-testid'?: string;
};

export const OnboardingOption = ({
    iconName,
    heading,
    description,
    onClick,
    'data-testid': dataTestId,
}: OnboardingOptionProps) => (
    <Card onClick={onClick} data-testid={dataTestId} paddingType="none">
        <Row
            gap={20}
            justifyContent={iconName ? 'flex-start' : 'center'}
            padding={{ vertical: 20, horizontal: 32 }}
        >
            {iconName && <Icon name={iconName} size={48} />}
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
