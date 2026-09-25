import { Translation } from '@suite/intl';
import { selectIsNftSectionEnabled, suiteSettingsActions } from '@suite/settings';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { Switch } from '@trezor/components';
import { SectionItem } from '@trezor/product-components';

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
