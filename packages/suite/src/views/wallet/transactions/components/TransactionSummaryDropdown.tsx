import { Dropdown } from '@trezor/components';

import { GraphScaleDropdownItem, Translation } from 'src/components/suite';

export const TransactionSummaryDropdown = () => (
    <Dropdown
        placement={{ position: 'bottom', alignment: 'start' }}
        items={[
            {
                key: 'group1',
                label: <Translation id="TR_GRAPH_VIEW" />,
                options: [
                    {
                        label: <GraphScaleDropdownItem />,
                        shouldCloseOnClick: false,
                    },
                ],
            },
        ]}
    />
);
