import styled from 'styled-components';

import { useSelector } from 'src/hooks/suite/useSelector';
import { AddressDisplayOptions, selectAddressDisplayType } from 'src/reducers/suite/suiteReducer';
import {
    selectDeviceInternalModel,
    selectDeviceUnavailableCapabilities,
} from '@suite-common/wallet-core';
import { DeviceModelInternal } from '@trezor/connect';
import { DisplayChunks } from './DisplayChunks';
import { DisplayPaginatedText } from './DisplayPaginatedText';

const Display = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 16px;
    min-height: 134px;
    width: 100%;
    background: #000;
    padding: 25px 12px;
`;

export interface DeviceDisplayProps {
    address: string;
    network?: string;
    valueDataTest?: string;
}

export const DeviceDisplay = ({ address, network, valueDataTest }: DeviceDisplayProps) => {
    const deviceModel = useSelector(selectDeviceInternalModel);
    const unavailableCapabilities = useSelector(selectDeviceUnavailableCapabilities);
    const addressDisplayType = useSelector(selectAddressDisplayType);

    if (!deviceModel) return null;

    // remove bitcoincash: prefix
    const processedAddress = address.startsWith('bitcoincash:')
        ? address.replace('bitcoincash:', '')
        : address;

    const areChunksUsed =
        addressDisplayType === AddressDisplayOptions.CHUNKED &&
        !unavailableCapabilities?.chunkify &&
        valueDataTest !== '@xpub-modal/xpub-field' &&
        network !== 'cardano' &&
        (network !== 'solana' || valueDataTest === '@modal/confirm-address/address-field');

    const isPixelType = deviceModel !== DeviceModelInternal.T2T1;

    return (
        <Display>
            {areChunksUsed ? (
                <DisplayChunks
                    address={address}
                    data-test={valueDataTest}
                    isPixelType={isPixelType}
                />
            ) : (
                <DisplayPaginatedText
                    deviceModel={deviceModel}
                    text={processedAddress}
                    isPixelType={isPixelType}
                    data-test={valueDataTest}
                />
            )}
        </Display>
    );
};
