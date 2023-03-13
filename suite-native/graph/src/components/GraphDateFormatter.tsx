import React from 'react';

import { differenceInDays } from 'date-fns';
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

export const GraphDateFormatter = ({
    firstPointDate,
    selectedPointAtom,
}: GraphDateFormatterProps) => {
    if (differenceInDays(firstPointDate, new Date()) < 7) {
        return <WeekFormatter selectedPointAtom={selectedPointAtom} />;
    }

    return <OtherDateFormatter selectedPointAtom={selectedPointAtom} />;
};
