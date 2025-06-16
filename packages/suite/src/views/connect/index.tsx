import styled from 'styled-components';

import { spacingsPx } from '@trezor/theme';

import { ConnectLayout } from 'src/components/suite/layouts/ConnectLayout/ConnectLayout';
import { DeviceSelector } from 'src/components/suite/layouts/SuiteLayout/DeviceSelector/DeviceSelector';
import { ModalSwitcher } from 'src/components/suite/modals/ModalSwitcher/ModalSwitcher';

const DeviceSelectorContainer = styled.div`
    position: absolute;
    top: ${spacingsPx.xs};
    left: 0;
`;

export const Connect = () => (
    <ConnectLayout>
        <DeviceSelectorContainer>
            <DeviceSelector />
        </DeviceSelectorContainer>

        <ModalSwitcher />
    </ConnectLayout>
);
