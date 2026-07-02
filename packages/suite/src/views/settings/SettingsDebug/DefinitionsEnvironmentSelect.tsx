import { selectDefinitionsChannel, suiteSettingsActions } from '@suite/settings';
import { type DefinitionsChannel } from '@trezor/connect-common';
import { isDesktop } from '@trezor/env-utils';
import { ActionColumn, ActionSelect, SectionItem, TextColumn } from '@trezor/product-components';

import { useDispatch, useSelector } from 'src/hooks/suite';

const options: { label: string; value: DefinitionsChannel }[] = [
    { label: 'Production', value: 'production' },
    { label: 'Development', value: 'development' },
    { label: 'Local', value: 'local' },
];

export const DefinitionsEnvironmentSelect = () => {
    const definitionsChannel = useSelector(selectDefinitionsChannel);
    const dispatch = useDispatch();

    const selectedOption = options.find(o => o.value === definitionsChannel) ?? options[0];
    const handleChange = (item: { value: DefinitionsChannel }) => {
        dispatch(suiteSettingsActions.setDebugMode({ definitionsChannel: item.value }));
    };

    return (
        <SectionItem>
            <TextColumn
                title="Definitions channel"
                description={`Set the source for Ethereum network, token and clear-signing definitions. ${isDesktop() ? 'Restart' : 'Refresh'} the application to apply changes.`}
            />
            <ActionColumn>
                <ActionSelect onChange={handleChange} value={selectedOption} options={options} />
            </ActionColumn>
        </SectionItem>
    );
};
