import styled from 'styled-components';

import { FirmwareUpdateSource } from '@trezor/connect/src/data/firmwareInfo';

import { setFirmwareUpdateSource } from 'src/actions/suite/suiteActions';
import { ActionColumn, ActionSelect, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';

const StyledActionSelect = styled(ActionSelect)`
    min-width: 256px;
`;

export const FirmwareUpdate = () => {
    const firmwareUpdateSource = useSelector(state => state.suite.settings.firmwareUpdateSource);
    const dispatch = useDispatch();

    const options: { label: string; value: FirmwareUpdateSource }[] = [
        { label: 'Production', value: 'production' },
        { label: 'Test Unsigned', value: 'test-unsigned' },
        { label: 'Test Signed', value: 'test-signed' },
        { label: 'Localhost Signed', value: 'localhost-signed' },
        { label: 'Localhost Unsigned', value: 'localhost-unsigned' },
    ];
    const selectedOption =
        options.find(option => option.value === firmwareUpdateSource) || options[0];

    const handleChange = (item: { value: FirmwareUpdateSource }) => {
        console.log('handleChange');
        dispatch(setFirmwareUpdateSource(item.value));
    };

    return (
        <SectionItem>
            <TextColumn
                title="Firmware Update Source"
                description="Set firmware update source for testing unsigned and signed. Remember you have to reload the web app or desktop in order for it to be fully applied."
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
