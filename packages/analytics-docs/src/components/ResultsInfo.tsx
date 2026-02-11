import { Box, Paragraph } from '@trezor/components';

import { useFilteredEvents } from '../utils/useFilteredEvents';

export const ResultsInfo = () => {
    const { filteredEvents, debouncedQuery, normalizedQuery, platform, allEvents } =
        useFilteredEvents();

    return (
        <Box width="100%">
            <Paragraph typographyStyle="label" variant="tertiary" flex="1">
                Showing <strong>{filteredEvents.length}</strong> of{' '}
                <strong>{allEvents.length}</strong> events
                {platform !== 'all' ? (
                    <>
                        {' '}
                        for platform <strong>{platform}</strong>
                    </>
                ) : null}
                {normalizedQuery ? (
                    <>
                        {' '}
                        matching <strong>{debouncedQuery.trim()}</strong>
                    </>
                ) : null}
            </Paragraph>
        </Box>
    );
};
