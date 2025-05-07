import { SelectBar, SelectBarProps } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { useGraph } from 'src/hooks/suite';
import { GraphScale } from 'src/types/wallet/graph';

export const GraphScaleDropdownItem = (props: Omit<SelectBarProps<GraphScale>, 'options'>) => {
    const { selectedView, setSelectedView } = useGraph();

    return (
        <SelectBar
            onChange={setSelectedView}
            orientation="vertical"
            selectedOption={selectedView}
            label={<Translation id="TR_GRAPH_VIEW" />}
            size="small"
            options={[
                { label: <Translation id="TR_GRAPH_LINEAR" />, value: 'linear' },
                { label: <Translation id="TR_GRAPH_LOGARITHMIC" />, value: 'log' },
            ]}
            {...props}
        />
    );
};
