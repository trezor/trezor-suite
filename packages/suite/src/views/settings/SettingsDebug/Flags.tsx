import { selectFlags, setFlag } from '@suite/flags';
import { Switch } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
import { typedObjectEntries } from '@trezor/utils';

import { useDispatch, useSelector } from 'src/hooks/suite';

export const Flags = () => {
    const dispatch = useDispatch();
    const flags = useSelector(selectFlags);

    const entries = typedObjectEntries(flags);

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
