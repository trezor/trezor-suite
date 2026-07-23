import { Translation } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import { Column, H3, Spinner } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { CardWithDevice } from 'src/views/suite/SwitchDevice/CardWithDevice';
import { SwitchDeviceModal } from 'src/views/suite/SwitchDevice/SwitchDeviceModal';

export const DiscoveryLoader = () => {
    const device = useSelector(selectSelectedDevice);
    if (!device) return null;

    return (
        <SwitchDeviceModal data-testid="@discovery/loader">
            <CardWithDevice device={device}>
                <Column
                    justifyContent="center"
                    alignItems="center"
                    margin={{ top: 40, bottom: 24 }}
                >
                    <Spinner size={48} />
                    <H3 align="center" margin={{ top: 48 }}>
                        <Translation id="TR_COIN_DISCOVERY_LOADER_DESCRIPTION" />
                    </H3>
                </Column>
            </CardWithDevice>
        </SwitchDeviceModal>
    );
};
