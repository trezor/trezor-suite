import { Box } from '@suite-native/atoms';
import { type TxKeyPath } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { TimeSwitchItem, type TimeSwitchValue } from './TimeSwitchItem';

type TimeSwitchProps = {
    selectedTimeFrame: TimeSwitchValue;
    onSelectTimeFrame: (valueBackInHours: TimeSwitchValue) => void;
};

type TimeSwitchItemType = {
    valueBackInHours: TimeSwitchValue;
    key: string;
    translationId: TxKeyPath;
};

export const timeSwitchItems: TimeSwitchItemType[] = [
    { key: '1d', valueBackInHours: 24, translationId: 'graph.timeSwitch.day' },
    { key: '1w', valueBackInHours: 168, translationId: 'graph.timeSwitch.week' },
    { key: '1m', valueBackInHours: 720, translationId: 'graph.timeSwitch.month' },
    { key: '6m', valueBackInHours: 4320, translationId: 'graph.timeSwitch.sixMonths' },
    { key: '1y', valueBackInHours: 8760, translationId: 'graph.timeSwitch.year' },
    { key: 'all', valueBackInHours: null, translationId: 'graph.timeSwitch.all' },
];

const timeSwitchStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: utils.spacings.sp16,
}));

export const TimeSwitch = ({ selectedTimeFrame = 24, onSelectTimeFrame }: TimeSwitchProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(timeSwitchStyle)}>
            {timeSwitchItems.map(item => (
                <TimeSwitchItem
                    key={item.key}
                    translationId={item.translationId}
                    value={item.valueBackInHours}
                    onSelectTimeFrame={onSelectTimeFrame}
                    selectedTimeFrame={selectedTimeFrame}
                />
            ))}
        </Box>
    );
};
