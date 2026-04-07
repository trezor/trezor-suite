import { selectInvityServerEnvironment, suiteSettingsActions } from '@suite/settings';
import { type InvityServerEnvironment, invityAPI } from '@suite-common/trading';
import { ActionColumn, ActionSelect, SectionItem, TextColumn } from '@trezor/product-components';

import { useDispatch, useSelector } from 'src/hooks/suite';

export const TradeApi = () => {
    const invityServerEnvironment = useSelector(selectInvityServerEnvironment);
    const dispatch = useDispatch();

    const invityApiServerOptions = Object.entries(invityAPI.SERVERS).map(
        ([environment, server]) => ({
            label: server,
            value: environment as InvityServerEnvironment,
        }),
    );
    const selectedInvityApiServer =
        invityApiServerOptions.find(s => s.value === invityServerEnvironment) ||
        invityApiServerOptions[0];

    const handleChange = (item: { value: InvityServerEnvironment; label: string }) => {
        dispatch(suiteSettingsActions.setDebugMode({ invityServerEnvironment: item.value }));
        invityAPI.setInvityServersEnvironment(item.value);
        invityAPI.resetCurrentAccount();
    };

    return (
        <SectionItem>
            <TextColumn
                title="API server"
                description="Set the server url for buy and exchange features"
            />
            <ActionColumn>
                <ActionSelect
                    onChange={handleChange}
                    value={selectedInvityApiServer}
                    options={invityApiServerOptions}
                />
            </ActionColumn>
        </SectionItem>
    );
};
