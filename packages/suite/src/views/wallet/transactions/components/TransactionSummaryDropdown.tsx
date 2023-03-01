import React from 'react';
import { Dropdown } from '@trezor/components';
import { GraphScaleDropdownItem } from '@suite-components/TransactionsGraph/components/GraphScaleDropdownItem';
import { Translation } from '@suite-components';

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
