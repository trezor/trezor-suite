import { selectIsNftSectionEnabled, suiteSettingsActions } from '@suite/settings';
import { Translation } from '@suite-lego/intl';
import { Switch } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { SectionItem } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from 'src/hooks/suite';

export const NftSection = () => {
    const { dispatch } = useServices(injectDispatch);
    const isEnabled = useSelector(selectIsNftSectionEnabled);

    const handleSwitchChange = () => {
        dispatch(suiteSettingsActions.setIsNftSectionEnabled(!isEnabled));
    };

    return (
        <SectionItem
            title={<Translation id="TR_EXPERIMENTAL_NFT_SECTION" />}
            description={<Translation id="TR_EXPERIMENTAL_NFT_SECTION_DESCRIPTION" />}
            actions={
                <Switch
                    isChecked={isEnabled}
                    onChange={handleSwitchChange}
                    data-testid="@settings/nft-section-switch"
                />
            }
        />
    );
};
