import React from 'react';
import { Dropdown } from '@trezor/components';
import GraphScaleDropdownItem from '@suite-components/TransactionsGraph/components/GraphScaleDropdownItem';

interface Props {
    isGraphHidden: boolean;
    setIsGraphHidden: (value: boolean) => void;
}

const TransactionSummaryDropdown = (_props: Props) => (
    // TODO: export transactions to a file

    <Dropdown
        alignMenu="right"
        offset={16}
        items={[
            {
                key: 'group1',
                label: 'Graph View',
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
export default TransactionSummaryDropdown;
