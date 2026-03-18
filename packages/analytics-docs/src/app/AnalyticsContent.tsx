import type { ReactNode } from 'react';
import { useLayoutEffect } from 'react';

import { Banner, Box, Column, Divider, Spinner, Text } from '@trezor/components';

const ScrollWhenReady = ({ onReady }: { onReady: () => void }) => {
    useLayoutEffect(() => {
        onReady();
    }, [onReady]);

    return null;
};

const formatGeneratedAt = (isoString: string): string => {
    const d = new Date(isoString);
    const YYYY = d.getFullYear();
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const DD = String(d.getDate()).padStart(2, '0');
    const HH = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');

    return `${YYYY}-${MM}-${DD}, ${HH}:${mm}`;
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
                        Docs generated at {formatGeneratedAt(generatedAt)}
                    </Text>
                </Box>
            )}
        </Column>
    );
};
