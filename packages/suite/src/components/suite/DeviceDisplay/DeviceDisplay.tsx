import styled from 'styled-components';
import { ReactNode } from 'react';

import { useSelector } from 'src/hooks/suite/useSelector';
import { selectDeviceInternalModel } from '@suite-common/wallet-core';
import { DeviceModelInternal } from '@trezor/connect';
import { DisplayChunks } from './DisplayChunks';
import { DisplayPaginatedText } from './DisplayPaginatedText';
import { DisplaySinglePageWrapText } from './DisplaySinglePageWrapText';
import { DisplayMode } from 'src/types/suite';

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
    displayMode: DisplayMode;
}

export const DeviceDisplay = ({ address, displayMode }: DeviceDisplayProps) => {
    const deviceModel = useSelector(selectDeviceInternalModel);

    if (!deviceModel) return null;

    const isPixelType = [
        DeviceModelInternal.T1B1,
        DeviceModelInternal.T2B1,
        DeviceModelInternal.T3B1,
    ].includes(deviceModel);

    const processedAddress = address.startsWith('bitcoincash:')
        ? address.replace('bitcoincash:', '')
        : address;

    const displayModeMap: Record<DisplayMode, ReactNode> = {
        [DisplayMode.CHUNKS]: (
            <DisplayChunks address={processedAddress} isPixelType={isPixelType} />
        ),
        [DisplayMode.PAGINATED_TEXT]: (
            <DisplayPaginatedText
                deviceModel={deviceModel}
                text={processedAddress}
                isPixelType={isPixelType}
            />
        ),
        [DisplayMode.SINGLE_WRAPPED_TEXT]: (
            <DisplaySinglePageWrapText isPixelType={isPixelType} text={processedAddress} />
        ),
    };

    return <Display>{displayModeMap[displayMode]}</Display>;
};
