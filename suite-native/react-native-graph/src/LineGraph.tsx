import { memo, ReactElement } from 'react';

import { AnimatedLineGraph } from './AnimatedLineGraph';
import type { LineGraphProps } from './LineGraphProps';
import { StaticLineGraph } from './StaticLineGraph';

export function LineGraphImpl<TEventPayload extends object>(
    props: LineGraphProps<TEventPayload>,
): ReactElement {
    if (props.animated) return <AnimatedLineGraph<TEventPayload> {...props} />;

    return <StaticLineGraph {...props} />;
}

export const LineGraph = memo(LineGraphImpl) as typeof LineGraphImpl;
