import { Dropdown } from '@trezor/components';

import { GraphScaleDropdownItem, Translation } from 'src/components/suite';

export const TransactionSummaryDropdown = () => (
    <Dropdown
        alignMenu="bottom-right"
        items={[
            {
                key: 'group1',
                label: <Translation id="TR_GRAPH_VIEW" />,
                options: [
                    {
                        key: 'graphView',
                        label: <GraphScaleDropdownItem />,
                        shouldCloseOnClick: false,
                    },
                ],
            },
        ]}
    />
);
