import { useTranslate } from '@suite-native/intl';

import { LegacySegmentedControl } from './LegacySegmentedControl';
import { NativeSegmentedControl, supportsNativeSegmentedControl } from './NativeSegmentedControl';
import { getNativeTextLabel } from './getNativeTextLabel';
import { type SegmentedControlProps } from './segmentedControlTypes';

export type { SegmentedControlOption, SegmentedControlProps } from './segmentedControlTypes';

const ResolvedNativeSegmentedControl = <TValue extends string>(
    props: SegmentedControlProps<TValue>,
) => {
    const { translate } = useTranslate();
    const options = props.options.flatMap(option => {
        const label = getNativeTextLabel({ label: option.label, translate });

        return label === null ? [] : [{ label, value: option.value }];
    });

    if (options.length !== props.options.length) {
        return <LegacySegmentedControl {...props} />;
    }

    return <NativeSegmentedControl {...props} options={options} />;
};

export const SegmentedControl = <TValue extends string>(props: SegmentedControlProps<TValue>) => {
    if (props.options.length === 0) {
        return null;
    }

    return supportsNativeSegmentedControl ? (
        <ResolvedNativeSegmentedControl {...props} />
    ) : (
        <LegacySegmentedControl {...props} />
    );
};
