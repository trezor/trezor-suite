import { selectDefinitionsChannel, suiteSettingsActions } from '@suite/settings';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { type DefinitionsChannel } from '@trezor/connect-common';
import { isDesktop } from '@trezor/env-utils';
import { SectionItem } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';

const options: { label: string; value: DefinitionsChannel }[] = [
    { label: 'Production', value: 'production' },
    { label: 'Development', value: 'development' },
    { label: 'Local', value: 'local' },
];

export const DefinitionsEnvironmentSelect = () => {
    const definitionsChannel = useSelector(selectDefinitionsChannel);
    const { dispatch } = useServices(injectDispatch);

    const selectedOption = options.find(o => o.value === definitionsChannel) ?? options[0];
    const handleChange = (item: { value: DefinitionsChannel }) => {
        dispatch(suiteSettingsActions.setDebugMode({ definitionsChannel: item.value }));
    };

    return (
        <SectionItem
            title="Definitions channel"
            description={`Set the source for Ethereum network, token and clear-signing definitions. ${isDesktop() ? 'Restart' : 'Refresh'} the application to apply changes.`}
            actions={
                <SectionItem.Select
                    onChange={handleChange}
                    value={selectedOption}
                    options={options}
                />
            }
        />
    );
};
