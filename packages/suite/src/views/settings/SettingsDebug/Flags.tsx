import {
    type BooleanFlagKey,
    type FlagsState,
    NewContentIndicatorId,
    selectFlags,
    setFlag,
    setNewContentIndicatorSeen,
} from '@suite/flags';
import { Switch } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
import { typedObjectEntries, typedObjectValues } from '@trezor/utils';

import { useDispatch, useSelector } from 'src/hooks/suite';

type FlagEntry = [keyof FlagsState, FlagsState[keyof FlagsState]];
type BooleanFlagEntry = [BooleanFlagKey, boolean];

const isBooleanFlagEntry = (entry: FlagEntry): entry is BooleanFlagEntry =>
    typeof entry[1] === 'boolean';

export const Flags = () => {
    const dispatch = useDispatch();
    const flags = useSelector(selectFlags);

    const entries = typedObjectEntries(flags).filter(isBooleanFlagEntry);

    return (
        <>
            {entries.map(([key, value]) => {
                const handleChange = () => {
                    dispatch(setFlag({ key, value: !value }));
                };

                return (
                    <SectionItem key={key}>
                        <TextColumn title={key} />
                        <ActionColumn>
                            <Switch isChecked={value} onChange={handleChange} />
                        </ActionColumn>
                    </SectionItem>
                );
            })}
            {typedObjectValues(NewContentIndicatorId).map(indicatorId => {
                const isSeen = flags.seenNewContentIndicators[indicatorId] === true;
                const handleChange = () => {
                    dispatch(setNewContentIndicatorSeen({ indicatorId, isSeen: !isSeen }));
                };

                return (
                    <SectionItem key={indicatorId}>
                        <TextColumn title={`seenNewContentIndicators.${indicatorId}`} />
                        <ActionColumn>
                            <Switch isChecked={isSeen} onChange={handleChange} />
                        </ActionColumn>
                    </SectionItem>
                );
            })}
        </>
    );
};
