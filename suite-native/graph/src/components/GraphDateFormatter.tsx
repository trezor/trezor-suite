import React from 'react';

import { Atom, useAtomValue } from 'jotai';

import { useFormatters } from '@suite-common/formatters';

import { EnhancedGraphPoint } from '../utils';

type SelectedPointAtom = Atom<EnhancedGraphPoint>;

type GraphDateFormatterProps = {
    firstPointDate: Date;
    selectedPointAtom: Atom<EnhancedGraphPoint>;
};

const WeekFormatter = ({ selectedPointAtom }: { selectedPointAtom: SelectedPointAtom }) => {
    const { DateTimeFormatter } = useFormatters();
    const { originalDate: value } = useAtomValue(selectedPointAtom);

    return <DateTimeFormatter value={value} />;
};

const OtherDateFormatter = ({ selectedPointAtom }: { selectedPointAtom: SelectedPointAtom }) => {
    const { DateFormatter } = useFormatters();

    const { originalDate: value } = useAtomValue(selectedPointAtom);
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
