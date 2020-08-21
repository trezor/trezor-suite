import React from 'react';
import { Dropdown } from '@trezor/components';
import GraphScaleDropdownItem from '@suite-components/TransactionsGraph/components/GraphScaleDropdownItem';

interface Props {
    isGraphHidden: boolean;
    setIsGraphHidden: (value: boolean) => void;
    onRefresh: () => void;
}

const TransactionSummaryDropdown = (props: Props) => {
    // TODO: export transactions to a file

    return (
        <Dropdown
            alignMenu="right"
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
                {
                    key: 'group2',
                    label: undefined,
                    options: [
                        // {
                        //     key: 'visibility',
                        //     label: props.isGraphHidden ? 'Show graph' : 'Hide graph',
                        //     callback: () => props.setIsGraphHidden(!props.isGraphHidden),
                        // },
                        {
                            key: 'refresh',
                            label: 'Refresh',
                            // icon: 'REFRESH',
                            callback: () => props.onRefresh(),
                        },
                    ],
                },
            ]}
        />
    );
};

export default TransactionSummaryDropdown;
