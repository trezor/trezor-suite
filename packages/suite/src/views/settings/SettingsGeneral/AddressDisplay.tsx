import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { selectAddressDisplayType, suiteSettingsActions } from '@suite/settings';
import { AddressDisplayOptions } from '@suite-common/wallet-types';
import { Switch } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

const getAddressDisplayType = (value: boolean) =>
    value ? AddressDisplayOptions.CHUNKED : AddressDisplayOptions.ORIGINAL;

export const AddressDisplay = () => {
    const dispatch = useDispatch();
    const analytics = useAnalytics();

    const selectedAddressDisplay = useSelector(selectAddressDisplayType);

    const onChange = (value: boolean) => {
        const addressDisplayType = getAddressDisplayType(value);

        analytics.report({
            type: events.settingsGeneralAddressDisplayTypeEvent.name,
            payload: { addressDisplayType },
        });

        dispatch(suiteSettingsActions.setAddressDisplayType(addressDisplayType));
    };

    return (
        <Anchor anchorId={SettingsAnchor.AddressDisplay}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                >
                    <TextColumn
                        title={<Translation id="TR_ADDRESS_DISPLAY" />}
                        description={<Translation id="TR_ADDRESS_DISPLAY_DESCRIPTION" />}
                    />
                    <ActionColumn>
                        <Switch
                            isChecked={selectedAddressDisplay === AddressDisplayOptions.CHUNKED}
                            onChange={onChange}
                        />
                    </ActionColumn>
                </SectionItem>
            )}
        </Anchor>
    );
};
