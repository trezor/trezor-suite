import { type ReactNode } from 'react';

import { type RequireAllOrNone } from 'type-fest';

import { type IconName } from '@suite-native/icons';

import { Card, type CardProps } from './Card';
import { TextButton } from '../Button/TextButton';
import { Headered } from '../Headered';
import { HStack } from '../Stack';
import { Text } from '../Text';

export type HeaderedCardProps = CardProps & CardHeaderProps;

type CardHeaderProps = RequireAllOrNone<
    {
        title: ReactNode;
        onButtonPress: () => void;
        buttonTitle: ReactNode;
        buttonIcon?: IconName;
    },
    'buttonTitle' | 'onButtonPress'
>;

const CardHeader = ({ title, onButtonPress, buttonTitle, buttonIcon }: CardHeaderProps) => (
    <HStack justifyContent="space-between">
        <Text color="textSubdued" variant="body-sm">
            {title}
        </Text>
        {buttonTitle && (
            <TextButton size="small" onPress={onButtonPress} viewRight={buttonIcon}>
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
