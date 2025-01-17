import { Atom, useAtomValue } from 'jotai';

import { useFormatters } from '@suite-common/formatters';
import { FiatGraphPoint } from '@suite-common/graph';
import { Text } from '@suite-native/atoms';

type SelectedPointAtom = Atom<FiatGraphPoint | null>;

type GraphDateFormatterProps = {
    firstPointDate: Date;
    selectedPointAtom: SelectedPointAtom;
};

const WeekFormatter = ({ selectedPointAtom }: { selectedPointAtom: SelectedPointAtom }) => {
    const { DateTimeFormatter } = useFormatters();
    const selectedPoint = useAtomValue(selectedPointAtom);

    // Empty space to prevent layout shift
    if (!selectedPoint) return <Text> </Text>;

    return <DateTimeFormatter value={selectedPoint.date} />;
};

const OtherDateFormatter = ({ selectedPointAtom }: { selectedPointAtom: SelectedPointAtom }) => {
    const { DateFormatter } = useFormatters();

    const selectedPoint = useAtomValue(selectedPointAtom);

    if (!selectedPoint) return null;

    return <DateFormatter value={selectedPoint.date} />;
};

const millisecondsPerTwoWeek = 1209600000;

export const GraphDateFormatter = ({
    firstPointDate,
    selectedPointAtom,
}: GraphDateFormatterProps) => {
    const millisecondElapsedFromFistPoint = new Date().getTime() - firstPointDate.getTime();
    // this check is significantly faster than using date-fns/differenceInWeeks(days)
    const isWeekFormatted = millisecondElapsedFromFistPoint < millisecondsPerTwoWeek;

    const Formatter = isWeekFormatted ? WeekFormatter : OtherDateFormatter;

    return (
        <Text variant="hint" color="textSubdued">
            <Formatter selectedPointAtom={selectedPointAtom} />
        </Text>
    );
};
