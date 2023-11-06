import { ReactNode } from 'react';

import { RequireAllOrNone } from 'type-fest';

import { IconName } from '@suite-common/icons';

import { Card, CardProps } from './Card';
import { Text } from '../Text';
import { Headered } from '../Headered';
import { HStack } from '../Stack';
import { TextButton } from '../Button/TextButton';

type HeaderedCardProps = CardProps & CardHeaderProps;

type CardHeaderProps = RequireAllOrNone<
    {
        title: ReactNode;
        onButtonPress: () => void;
        buttonTitle: string;
        buttonIcon?: IconName;
    },
    'buttonTitle' | 'onButtonPress'
>;

const CardHeader = ({ title, onButtonPress, buttonTitle, buttonIcon }: CardHeaderProps) => (
    <HStack justifyContent="space-between">
        <Text color="textSubdued" variant="hint">
            {title}
        </Text>
        {buttonTitle && (
            <TextButton size="s" onPress={onButtonPress} iconRight={buttonIcon}>
                {buttonTitle}
            </TextButton>
        )}
    </HStack>
);
export const HeaderedCard = ({ children, style, ...headerProps }: HeaderedCardProps) => (
    <Headered header={<CardHeader {...headerProps} />}>
        <Card style={style}>{children}</Card>
    </Headered>
);
