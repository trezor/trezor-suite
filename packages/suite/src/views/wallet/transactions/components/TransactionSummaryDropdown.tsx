import { Box, Dropdown } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { GraphScaleDropdownItem } from 'src/components/suite';

export const TransactionSummaryDropdown = () => (
    <Dropdown
        placement={{ position: 'bottom', alignment: 'start' }}
        content={
            <Box padding={spacings.xxs}>
                <GraphScaleDropdownItem />
            </Box>
        }
    />
);
