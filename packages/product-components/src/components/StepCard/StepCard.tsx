import { type ReactNode } from 'react';

import {
    Card,
    Column,
    Divider,
    Icon,
    type IconName,
    Paragraph,
    Row,
    Text,
} from '@trezor/components';

type StepCardProps = {
    heading: ReactNode;
    description: ReactNode;
    actions: ReactNode;
    icon: IconName;
    descriptionTypographyStyle?: 'body-md-strong' | 'inherit';
    state: 'default' | 'confirmed' | 'pending';
};

export const StepCard = ({
    heading,
    description,
    actions,
    icon,
    state,
    descriptionTypographyStyle = 'body-md-strong',
}: StepCardProps) => {
    const iconIntent = state === 'confirmed' ? 'brand' : 'neutral';
    const iconPriority = state === 'confirmed' ? 'primary' : 'secondary';
    const textIntent = state === 'confirmed' ? 'brand' : 'neutral';
    const textPriority = state === 'confirmed' ? 'primary' : 'secondary';

    return (
        <Card paddingType="none" fillType={state === 'pending' ? 'flat' : 'default'}>
            <Column>
                <Row gap={8} padding={{ horizontal: 16, vertical: 12 }}>
                    <Icon
                        name={state === 'confirmed' ? 'check' : icon}
                        intent={iconIntent}
                        priority={iconPriority}
                        size={20}
                    />
                    <Text typographyStyle="body-sm" intent={textIntent} priority={textPriority}>
                        {heading}
                    </Text>
                </Row>
                {state === 'default' && (
                    <>
                        <Divider margin={0} />
                        <Column gap={16} padding={{ horizontal: 16, vertical: 12 }}>
                            <Paragraph typographyStyle={descriptionTypographyStyle}>
                                {description}
                            </Paragraph>
                            <Row gap={12}>{actions}</Row>
                        </Column>
                    </>
                )}
            </Column>
        </Card>
    );
};
