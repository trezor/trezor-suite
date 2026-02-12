import { Box, Paragraph } from '@trezor/components';

type ResultsInfoProps = {
    filteredCount: number;
    totalCount: number;
    platform: string;
    query: string;
};

export const ResultsInfo = ({
    filteredCount,
    totalCount,
    platform,
    query,
}: ResultsInfoProps) => (
    <Box width="100%">
        <Paragraph typographyStyle="label" variant="tertiary" flex="1">
            Showing <strong>{filteredCount}</strong> of <strong>{totalCount}</strong> events
            {platform !== 'all' ? (
                <>
                    {' '}
                    for platform <strong>{platform}</strong>
                </>
            ) : null}
            {query ? (
                <>
                    {' '}
                    matching <strong>{query.trim()}</strong>
                </>
            ) : null}
        </Paragraph>
    </Box>
);
