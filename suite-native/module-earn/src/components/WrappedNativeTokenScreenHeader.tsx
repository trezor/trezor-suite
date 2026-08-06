import { type ComponentProps, type ReactElement } from 'react';

import { Text } from '@suite-native/atoms';
import { type Translation } from '@suite-native/intl';
import { ScreenHeader } from '@suite-native/navigation';

type WrappedNativeTokenScreenHeaderProps = {
    accountLabel: string;
    title: ReactElement<ComponentProps<typeof Translation>>;
};

export const WrappedNativeTokenScreenHeader = ({
    accountLabel,
    title,
}: WrappedNativeTokenScreenHeaderProps) => (
    <ScreenHeader
        closeActionType="back"
        customContent={
            <>
                <Text variant="body-md-strong" numberOfLines={1}>
                    {title}
                </Text>
                <Text
                    variant="body-xs"
                    color="contentSecondary"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {accountLabel}
                </Text>
            </>
        }
    />
);
