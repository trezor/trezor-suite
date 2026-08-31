import { useDispatch } from 'react-redux';

import { Translation } from '@suite/intl';
import { selectIsNftSectionEnabled, suiteSettingsActions } from '@suite/settings';
import { useSelector } from '@suite-common/redux-utils';
import { Switch } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
export const NftSection = () => {
    const dispatch = useDispatch();
    const isEnabled = useSelector(selectIsNftSectionEnabled);

    const handleSwitchChange = () => {
        dispatch(suiteSettingsActions.setIsNftSectionEnabled(!isEnabled));
    };

    return (
        <SectionItem>
            <TextColumn
                title={<Translation id="TR_EXPERIMENTAL_NFT_SECTION" />}
                description={<Translation id="TR_EXPERIMENTAL_NFT_SECTION_DESCRIPTION" />}
            />
            <ActionColumn>
                <Switch
                    isChecked={isEnabled}
                    onChange={handleSwitchChange}
                    data-testid="@settings/nft-section-switch"
                />
            </ActionColumn>
        </SectionItem>
    );
};
