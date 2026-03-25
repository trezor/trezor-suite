import { firmwareActions, selectEffectiveFirmwareChannel } from '@suite-common/firmware';
import { Column, Text } from '@trezor/components';
import { type FirmwareChannel } from '@trezor/connect/src/types/firmware';
import { ActionColumn, ActionSelect, SectionItem, TextColumn } from '@trezor/product-components';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectDesktopUpdateAllowPrerelease } from 'src/reducers/suite/desktopUpdateReducer';

const effectiveFirmwareChannel = selectEffectiveFirmwareChannel(selectDesktopUpdateAllowPrerelease);

export const FirmwareUpdateEnvironmentSelect = () => {
    const firmwareChannel = useSelector(effectiveFirmwareChannel);
    const isAllowPrerelease = useSelector(selectDesktopUpdateAllowPrerelease);
    const dispatch = useDispatch();

    const options: { label: string; value: FirmwareChannel }[] = [
        { label: 'Production', value: 'production' },
        { label: 'Production Early Access', value: 'production-early-access' },
        { label: 'Test Unsigned', value: 'test-unsigned' },
        { label: 'Test Unsigned Stable', value: 'test-unsigned-stable' },
        { label: 'Test Signed', value: 'test-signed' },
        { label: 'Localhost Signed', value: 'localhost-signed' },
        { label: 'Localhost Unsigned', value: 'localhost-unsigned' },
    ];
    const selectedOption = options.find(o => o.value === firmwareChannel) ?? options[0];
    const handleChange = (item: { value: FirmwareChannel }) => {
        dispatch(firmwareActions.setFirmwareChannel(item.value));
    };

    return (
        <SectionItem>
            <TextColumn
                title="Firmware Channel"
                description={
                    <Column gap={4}>
                        <Text>
                            Set firmware channel for testing unsigned and signed. Remember you have
                            to reload the web app or desktop in order for it to be fully applied.
                        </Text>
                        <Text intent="info">
                            If you select production, the binaries will be cached.
                        </Text>
                        {isAllowPrerelease && (
                            <Text intent="warning">
                                Early Access program is enabled. Firmware channel is fixed to
                                Production Early Access.
                            </Text>
                        )}
                    </Column>
                }
            />
            <ActionColumn>
                <ActionSelect
                    onChange={handleChange}
                    value={selectedOption}
                    options={options}
                    isDisabled={isAllowPrerelease}
                />
            </ActionColumn>
        </SectionItem>
    );
};
