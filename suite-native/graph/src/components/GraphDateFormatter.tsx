import { type Atom, useAtomValue } from 'jotai';

import { useFormatters } from '@suite-common/formatters';
import { Text } from '@suite-native/atoms';

type SelectedPointTimestampAtom = Atom<number | null>;

type GraphDateFormatterProps = {
    firstPointDate: Date;
    selectedPointTimestampAtom: SelectedPointTimestampAtom;
};

const WeekFormatter = ({
    selectedPointTimestampAtom,
}: {
    selectedPointTimestampAtom: SelectedPointTimestampAtom;
}) => {
    const { DateTimeFormatter } = useFormatters();
    const selectedPointTimestamp = useAtomValue(selectedPointTimestampAtom);

    // Empty space to prevent layout shift
    if (selectedPointTimestamp === null) return <Text> </Text>;

    return <DateTimeFormatter value={new Date(selectedPointTimestamp)} />;
};

const OtherDateFormatter = ({
    selectedPointTimestampAtom,
}: {
    selectedPointTimestampAtom: SelectedPointTimestampAtom;
}) => {
    const { DateFormatter } = useFormatters();

    const selectedPointTimestamp = useAtomValue(selectedPointTimestampAtom);

    if (selectedPointTimestamp === null) return null;

    return <DateFormatter value={new Date(selectedPointTimestamp)} />;
};

const millisecondsPerTwoWeek = 1209600000;

export const GraphDateFormatter = ({
    firstPointDate,
    selectedPointTimestampAtom,
}: GraphDateFormatterProps) => {
    const millisecondElapsedFromFistPoint = new Date().getTime() - firstPointDate.getTime();
    // this check is significantly faster than using date-fns/differenceInWeeks(days)
    const isWeekFormatted = millisecondElapsedFromFistPoint < millisecondsPerTwoWeek;

    const Formatter = isWeekFormatted ? WeekFormatter : OtherDateFormatter;

    return (
        <Text variant="body-sm" color="contentSecondary">
            <Formatter selectedPointTimestampAtom={selectedPointTimestampAtom} />
        </Text>
    );
};
