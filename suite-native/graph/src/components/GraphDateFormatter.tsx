import { Atom, useAtomValue } from 'jotai';

import { useFormatters } from '@suite-common/formatters';
import { FiatGraphPoint } from '@suite-common/graph';
import { Text } from '@suite-native/atoms';

type SelectedPointAtom = Atom<FiatGraphPoint>;

type GraphDateFormatterProps = {
    firstPointDate: Date;
    selectedPointAtom: Atom<FiatGraphPoint>;
};

const WeekFormatter = ({ selectedPointAtom }: { selectedPointAtom: SelectedPointAtom }) => {
    const { DateTimeFormatter } = useFormatters();
    const { date: value } = useAtomValue(selectedPointAtom);

    return <DateTimeFormatter value={value} />;
};

const OtherDateFormatter = ({ selectedPointAtom }: { selectedPointAtom: SelectedPointAtom }) => {
    const { DateFormatter } = useFormatters();

    const { date: value } = useAtomValue(selectedPointAtom);

    return <DateFormatter value={value} />;
};

const millisecondsPerTwoWeek = 1209600000;

export const GraphDateFormatter = ({
    firstPointDate,
    selectedPointAtom,
}: GraphDateFormatterProps) => {
    const millisecondElapsedFromFistPoint = new Date().getTime() - firstPointDate.getTime();
    // this check is significantly faster than using date-fns/differenceInWeeks(days)
    const isWeekFormatted = millisecondElapsedFromFistPoint < millisecondsPerTwoWeek;

    return (
        <Text variant="hint" color="textSubdued">
            {isWeekFormatted ? (
                <WeekFormatter selectedPointAtom={selectedPointAtom} />
            ) : (
                <OtherDateFormatter selectedPointAtom={selectedPointAtom} />
            )}
        </Text>
    );
};
