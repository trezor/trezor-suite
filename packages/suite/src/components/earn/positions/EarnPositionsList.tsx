import { type ReactNode } from 'react';

import { Translation, type TranslationId } from '@suite/intl';
import { Banner, Button, Column, Text } from '@trezor/components';

import { EarnPositionCardSkeleton } from './EarnPositionCardSkeleton';

type EarnPositionsListProps<T> = {
    translationId: TranslationId;
    items: readonly T[];
    render: (item: T) => ReactNode;
    isLoading?: boolean;
    isError?: boolean;
    refetch?: () => void;
};

export const EarnPositionsList = <T,>({
    translationId,
    items,
    render,
    isLoading = false,
    isError = false,
    refetch,
}: EarnPositionsListProps<T>) => {
    const title = (
        <Text typographyStyle="headline-sm">
            <Translation id={translationId} />
        </Text>
    );

    if (isLoading) {
        return (
            <Column gap={12}>
                {title}

                <EarnPositionCardSkeleton />
                <EarnPositionCardSkeleton />
                <EarnPositionCardSkeleton />
            </Column>
        );
    }

    const errorBanner = isError && (
        <Banner
            intent="warning"
            description={
                <Translation
                    id={
                        items.length === 0
                            ? 'TR_EARN_MY_POSITIONS_FAILED_TO_LOAD'
                            : 'TR_EARN_MY_POSITIONS_FAILED_TO_REFRESH'
                    }
                />
            }
            rightContent={
                <Button intent="warning" onClick={refetch}>
                    <Translation id="TR_RETRY" />
                </Button>
            }
        />
    );

    return (
        <Column gap={12}>
            {title}
            {errorBanner}
            {items.map(render)}
        </Column>
    );
};
