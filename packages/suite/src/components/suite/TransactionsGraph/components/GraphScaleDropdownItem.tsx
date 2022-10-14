import React from 'react';

import { useGraph } from '@suite-hooks';
import { Translation } from '@suite-components';

import { SelectBar, SelectBarProps } from '@trezor/components';
import { GraphScale } from '@suite-common/wallet-graph';

const GraphScaleDropdownItem = (props: Omit<SelectBarProps<GraphScale>, 'options'>) => {
    const { selectedView, setSelectedView } = useGraph();

    return (
        <SelectBar
            onChange={setSelectedView}
            selectedOption={selectedView}
            options={[
                { label: <Translation id="TR_GRAPH_LINEAR" />, value: 'linear' },
                { label: <Translation id="TR_GRAPH_LOGARITHMIC" />, value: 'log' },
            ]}
            {...props}
        />
    );
};

export default GraphScaleDropdownItem;
