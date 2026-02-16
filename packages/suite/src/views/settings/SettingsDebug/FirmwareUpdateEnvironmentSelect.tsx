import styled from 'styled-components';

import { firmwareActions, selectFirmwareChannel } from '@suite-common/firmware';
import { Column, Text } from '@trezor/components';
import { FirmwareChannel } from '@trezor/connect/src/types/firmware';

import { ActionColumn, ActionSelect, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';

const StyledActionSelect = styled(ActionSelect)`
    min-width: 256px;
`;

export const FirmwareUpdateEnvironmentSelect = () => {
    const firmwareChannel = useSelector(selectFirmwareChannel);
    const dispatch = useDispatch();

    const options: { label: string; value: FirmwareChannel }[] = [
        { label: 'Production', value: 'production' },
        { label: 'Test Unsigned', value: 'test-unsigned' },
        { label: 'Test Unsigned Stable', value: 'test-unsigned-stable' },
        { label: 'Test Signed', value: 'test-signed' },
        { label: 'Localhost Signed', value: 'localhost-signed' },
        { label: 'Localhost Unsigned', value: 'localhost-unsigned' },
    ];
    const selectedOption = options.find(option => option.value === firmwareChannel) || options[0];

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
                    </Column>
                }
            />
            <ActionColumn>
                <StyledActionSelect
                    onChange={handleChange}
                    value={selectedOption}
                    options={options}
                />
            </ActionColumn>
        </SectionItem>
    );
};
