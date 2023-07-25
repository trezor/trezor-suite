import React from 'react';

import { Atom, useAtomValue } from 'jotai';

import { useFormatters } from '@suite-common/formatters';
import { FiatGraphPoint } from '@suite-common/graph';

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
    if (millisecondElapsedFromFistPoint < millisecondsPerTwoWeek) {
        return <WeekFormatter selectedPointAtom={selectedPointAtom} />;
    }

    return <OtherDateFormatter selectedPointAtom={selectedPointAtom} />;
};
