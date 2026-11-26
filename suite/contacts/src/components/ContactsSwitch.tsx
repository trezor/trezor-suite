import { useSelector } from 'react-redux';

import { selectIsContactsEnabled, suiteSettingsActions } from '@suite/settings';
import { Switch } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { SectionItem } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

export const ContactsSwitch = () => {
    const isContactsEnabled = useSelector(selectIsContactsEnabled);
    const { dispatch } = useServices(injectDispatch);

    const handleChange = (isChecked: boolean) =>
        dispatch(suiteSettingsActions.setDebugMode({ isContactsEnabled: isChecked }));

    return (
        <SectionItem
            title="Contacts (pay to contact)"
            description="Proof of concept: pay contacts your Trezor shows by name. Needs WARD firmware and a wardd running next to Suite desktop."
            actions={
                <Switch
                    isChecked={isContactsEnabled}
                    onChange={handleChange}
                    data-testid="@settings/debug/contacts/switch"
                />
            }
        />
    );
};
