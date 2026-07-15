import { type ReactNode } from 'react';

import {
    Card,
    Column,
    Divider,
    Icon,
    type IconComponent,
    Paragraph,
    Row,
    Text,
} from '@trezor/components';
import { CheckIcon } from '@trezor/icons';

type StepCardProps = {
    heading: ReactNode;
    description: ReactNode;
    actions: ReactNode;
    icon: IconComponent;
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
    const IconComponent = state === 'confirmed' ? CheckIcon : icon;
    const iconIntent = state === 'confirmed' ? 'brand' : 'neutral';
    const iconPriority = state === 'confirmed' ? 'primary' : 'secondary';
    const textIntent = state === 'confirmed' ? 'brand' : 'neutral';
    const textPriority = state === 'confirmed' ? 'primary' : 'secondary';

    return (
        <Card paddingType="none" type={state === 'pending' ? 'contrast' : 'raised'}>
            <Column>
                <Row gap={8} padding={{ horizontal: 16, vertical: 12 }}>
                    <Icon
                        as={IconComponent}
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
