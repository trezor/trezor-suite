import styled from 'styled-components';
import { H3, Spinner, Text } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { CardWithDevice } from 'src/views/suite/SwitchDevice/CardWithDevice';
import { SwitchDeviceRenderer } from 'src/views/suite/SwitchDevice/SwitchDeviceRenderer';
import { useSelector } from 'src/hooks/suite';
import { selectDevice } from '@suite-common/wallet-core';

const Expand = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    justify-content: center;
    align-items: center;
    margin: 40px 0;
`;

export const DiscoveryLoader = () => {
    const device = useSelector(selectDevice);
    if (!device) return null;

    return (
        <SwitchDeviceRenderer isCancelable={false} data-test="@discovery/loader">
            <CardWithDevice device={device}>
                <Expand>
                    <Spinner size={80} isGrey={false} />
                    <H3>
                        <Translation id="TR_COIN_DISCOVERY_IN_PROGRESS" />
                    </H3>
                    <Text color="textSubdued">
                        <Translation id="TR_TO_FIND_YOUR_ACCOUNTS_AND" />
                    </Text>
                </Expand>
            </CardWithDevice>
        </SwitchDeviceRenderer>
    );
};
