import { type FlagsState, selectFlags, setFlag } from '@suite/flags';
import { Switch } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { useDispatch, useSelector } from 'src/hooks/suite';

type FlagKey = keyof FlagsState;

export const Flags = () => {
    const dispatch = useDispatch();
    const flags = useSelector(selectFlags);

    const entries = Object.entries(flags) as [FlagKey, FlagsState[FlagKey]][];

    return (
        <>
            {entries.map(([key, value]) => {
                if (typeof value !== 'boolean') {
                    return null;
                }

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
        </>
    );
};
