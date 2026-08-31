import { useDispatch } from 'react-redux';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { selectAddressDisplayType, setAddressDisplayType } from '@suite-common/wallet-core';
import { AddressDisplayOptions } from '@suite-common/wallet-types';
import { Switch } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';

const getAddressDisplayType = (value: boolean) =>
    value ? AddressDisplayOptions.CHUNKED : AddressDisplayOptions.ORIGINAL;

export const AddressDisplay = () => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);

    const selectedAddressDisplay = useSelector(selectAddressDisplayType);

    const onChange = (value: boolean) => {
        const addressDisplayType = getAddressDisplayType(value);

        analytics.report({
            type: events.settingsGeneralAddressDisplayTypeEvent.name,
            payload: { addressDisplayType },
        });

        dispatch(setAddressDisplayType(addressDisplayType));
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
