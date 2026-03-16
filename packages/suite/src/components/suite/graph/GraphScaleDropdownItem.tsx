import { Translation } from '@suite/intl';
import { SelectBar, type SelectBarProps } from '@trezor/components';

import { useGraph } from 'src/hooks/suite';
import { type GraphScale } from 'src/types/wallet/graph';

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
