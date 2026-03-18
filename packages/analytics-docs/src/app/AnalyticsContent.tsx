import type { ReactNode } from 'react';
import { useLayoutEffect } from 'react';

import { format } from 'date-fns';

import { Banner, Box, Column, Divider, Spinner, Text } from '@trezor/components';

const ScrollWhenReady = ({ onReady }: { onReady: () => void }) => {
    useLayoutEffect(() => {
        onReady();
    }, [onReady]);

    return null;
};

type AnalyticsContentProps = {
    isAnalyticsDataLoading: boolean;
    isAnalyticsDataGenerated: boolean;
    eventCards: ReactNode;
    hasEventCards: boolean;
    generatedAt?: string;
    onContentReady?: () => void;
};

export const AnalyticsContent = ({
    isAnalyticsDataLoading,
    isAnalyticsDataGenerated,
    eventCards,
    hasEventCards,
    generatedAt,
    onContentReady,
}: AnalyticsContentProps) => {
    if (isAnalyticsDataLoading) return <Spinner size={20} />;
    if (!isAnalyticsDataGenerated) {
        return (
            <Banner
                intent="warning"
                icon
                description={
                    <>
                        File{' '}
                        <Text isMonospaced typographyStyle="inherit">
                            analytics.json
                        </Text>{' '}
                        has not been generated. Run{' '}
                        <Text isMonospaced typographyStyle="inherit">
                            yarn build-data
                        </Text>{' '}
                        (or{' '}
                        <Text isMonospaced typographyStyle="inherit">
                            yarn dev
                        </Text>
                        ) to generate it.
                    </>
                }
            />
        );
    }

    return (
        <Column gap={40}>
            {eventCards}
            {onContentReady && hasEventCards && <ScrollWhenReady onReady={onContentReady} />}
            {generatedAt && (
                <Box>
                    <Divider margin={{ top: 0, bottom: 12 }} />
                    <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                        Docs generated at {format(new Date(generatedAt), 'yyyy-MM-dd, HH:mm')}
                    </Text>
                </Box>
            )}
        </Column>
    );
};
