import { H3, Spinner, Column } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { CardWithDevice } from 'src/views/suite/SwitchDevice/CardWithDevice';
import { SwitchDeviceModal } from 'src/views/suite/SwitchDevice/SwitchDeviceModal';
import { useSelector } from 'src/hooks/suite';
import { selectDevice } from '@suite-common/wallet-core';
import { spacings } from '@trezor/theme';

export const DiscoveryLoader = () => {
    const device = useSelector(selectDevice);
    if (!device) return null;

    return (
        <SwitchDeviceModal data-testid="@discovery/loader">
            <CardWithDevice device={device} isFullHeaderVisible={false}>
                <Column
                    justifyContent="center"
                    margin={{ top: spacings.xxxl, bottom: spacings.xl }}
                >
                    <Spinner size={80} isGrey={false} />
                    <H3 align="center" margin={{ top: spacings.xxxxl }}>
                        <Translation id="TR_COIN_DISCOVERY_LOADER_DESCRIPTION" />
                    </H3>
                </Column>
            </CardWithDevice>
        </SwitchDeviceModal>
    );
};
