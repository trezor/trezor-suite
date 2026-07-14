import { Box, PictogramTitleHeader } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const SearchNoResults = () => (
    <Box flex={0.8} justifyContent="center">
        <PictogramTitleHeader
            variant="info"
            icon="magnifyingGlass"
            title={<Translation id="search.noResults" />}
        />
    </Box>
);
