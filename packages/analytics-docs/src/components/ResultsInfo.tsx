import { Box, Link, Paragraph, Row } from '@trezor/components';

type ResultsInfoProps = {
    filteredCount: number;
    totalCount: number;
    platform: string;
    query: string;
    hasActiveFilters?: boolean;
    onClearAll?: () => void;
};

export const ResultsInfo = ({
    filteredCount,
    totalCount,
    platform,
    query,
    hasActiveFilters,
    onClearAll,
}: ResultsInfoProps) => (
    <Row gap={8} alignItems="center" flex="1">
        <Paragraph typographyStyle="label" variant="tertiary">
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
            .
        </Paragraph>
        {hasActiveFilters && onClearAll && (
            <Box cursor="pointer">
                <Link onClick={onClearAll} typographyStyle="label">
                    Clear filters
                </Link>
            </Box>
        )}
    </Row>
);
