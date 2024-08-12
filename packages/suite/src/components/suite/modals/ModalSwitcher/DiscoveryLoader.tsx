import styled from 'styled-components';
import { H3, Spinner } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { CardWithDevice } from 'src/views/suite/SwitchDevice/CardWithDevice';
import { SwitchDeviceRenderer } from 'src/views/suite/SwitchDevice/SwitchDeviceRenderer';
import { useSelector } from 'src/hooks/suite';
import { selectDevice } from '@suite-common/wallet-core';
import { spacingsPx } from '@trezor/theme';

const Expand = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    justify-content: center;
    align-items: center;
    margin: ${spacingsPx.xxxl} 0 ${spacingsPx.xl};
`;

export const DiscoveryLoader = () => {
    const device = useSelector(selectDevice);
    if (!device) return null;

    return (
        <SwitchDeviceRenderer isCancelable={false} data-testid="@discovery/loader">
            <CardWithDevice device={device} isFullHeaderVisible={false}>
                <Expand>
                    <Spinner size={80} isGrey={false} margin={{ bottom: 48 }} />
                    <H3 align="center">
                        <Translation id="TR_COIN_DISCOVERY_LOADER_DESCRIPTION" />
                    </H3>
                </Expand>
            </CardWithDevice>
        </SwitchDeviceRenderer>
    );
};
