import React from 'react';
import { SelectBar, SelectBarProps } from '@trezor/components';
import { useGraph } from '@suite-hooks';

const GraphScaleDropdownItem = (props: Omit<SelectBarProps, 'options'>) => {
    const { selectedView, setSelectedView } = useGraph();

    return (
        <SelectBar
            onChange={option => {
                setSelectedView(option as 'linear' | 'log');
                return false;
            }}
            selectedOption={selectedView}
            options={[
                { label: 'Linear', value: 'linear' },
                { label: 'Logarithmic', value: 'log' },
            ]}
            {...props}
        />
    );
};

export default GraphScaleDropdownItem;
