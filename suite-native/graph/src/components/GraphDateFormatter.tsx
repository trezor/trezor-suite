import React from 'react';

import { differenceInDays, isSameDay } from 'date-fns';
import { Atom, useAtomValue } from 'jotai';

import { useFormatters } from '@suite-common/formatters';

import { EnhancedGraphPoint } from '../utils';

type SelectedPointAtom = Atom<EnhancedGraphPoint>;

type GraphDateFormatterProps = {
    firstPointDate: Date;
    selectedPointAtom: Atom<EnhancedGraphPoint>;
};

const SameDayFormatter = ({ selectedPointAtom }: { selectedPointAtom: SelectedPointAtom }) => {
    const { TimeFormatter } = useFormatters();
    const point = useAtomValue(selectedPointAtom);
    return <TimeFormatter value={point.date} />;
};

const WeekFormatter = ({ selectedPointAtom }: { selectedPointAtom: SelectedPointAtom }) => {
    const { DateTimeFormatter, TimeFormatter } = useFormatters();
    const { originalDate: value } = useAtomValue(selectedPointAtom);
    if (isSameDay(value, new Date())) {
        return <TimeFormatter value={value} />;
    }
    return <DateTimeFormatter value={value} />;
};

const OtherDateFormatter = ({ selectedPointAtom }: { selectedPointAtom: SelectedPointAtom }) => {
    const { DateFormatter } = useFormatters();

    const { originalDate: value } = useAtomValue(selectedPointAtom);
    return <DateFormatter value={value} />;
};

export const GraphDateFormatter = ({
    firstPointDate,
    selectedPointAtom,
}: GraphDateFormatterProps) => {
    if (isSameDay(firstPointDate, new Date())) {
        return <SameDayFormatter selectedPointAtom={selectedPointAtom} />;
    }
    if (differenceInDays(firstPointDate, new Date()) < 7) {
        return <WeekFormatter selectedPointAtom={selectedPointAtom} />;
    }

    return <OtherDateFormatter selectedPointAtom={selectedPointAtom} />;
};
