import { useGraph } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';

import { SelectBar, SelectBarProps } from '@trezor/components';
import { GraphScale } from 'src/types/wallet/graph';

export const GraphScaleDropdownItem = (props: Omit<SelectBarProps<GraphScale>, 'options'>) => {
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
