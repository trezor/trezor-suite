import { Dropdown } from '@trezor/components';

import { GraphScaleDropdownItem, Translation } from 'src/components/suite';

export const TransactionSummaryDropdown = () => (
    <Dropdown
        alignMenu="right"
        offset={16}
        items={[
            {
                key: 'group1',
                label: <Translation id="TR_GRAPH_VIEW" />,
                options: [
                    {
                        key: 'graphView',
                        noHover: true,
                        label: <GraphScaleDropdownItem />,
                        callback: () => false,
                    },
                ],
            },
        ]}
    />
);
