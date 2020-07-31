import React from 'react';
import { Dropdown } from '@trezor/components';
// import { useGraph } from '@suite-hooks';

interface Props {
    isGraphHidden: boolean;
    setIsGraphHidden: (value: boolean) => void;
    onRefresh: () => void;
}

const TransactionSummaryDropdown = (props: Props) => {
    // const { selectedView, setSelectedView } = useGraph();

    // TODO: export transactions to a file

    return (
        <Dropdown
            alignMenu="right"
            items={[
                // {
                //     key: 'group1',
                //     label: 'Graph View',
                //     options: [
                //         {
                //             key: 'graphView',
                //             noHover: true,
                //             label: (
                //                 <SelectBar
                //                     onChange={option => setSelectedView(option as 'linear' | 'log')}
                //                     selectedOption={selectedView}
                //                     options={[
                //                         { label: 'Linear', value: 'linear' },
                //                         { label: 'Logarithmic', value: 'log' },
                //                     ]}
                //                 />
                //             ),
                //             callback: () => false,
                //         },
                //     ],
                // },
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
