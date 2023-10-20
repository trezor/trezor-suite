import styled from 'styled-components';

import { useSelector } from 'src/hooks/suite/useSelector';
import { MAX_ADDRESS_DISPLAY_LENGTH } from 'src/constants/suite/device';
import { AddressDisplayOptions, selectAddressDisplay } from 'src/reducers/suite/suiteReducer';
import { selectDeviceUnavailableCapabilities } from '@suite-common/wallet-core';

const Display = styled.div<{ isPixelType?: boolean }>`
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 16px;
    height: 159px;
    width: 100%;
    background: #000000;
    padding: 0 12px;
`;

const Text = styled.div<{ isPixelType?: boolean }>`
    display: flex;
    gap: 10px;
    font-family: ${props => (props.isPixelType ? 'PixelOperatorMono8' : 'RobotoMono')};
    font-size: ${props => (props.isPixelType ? '16' : '18')}px;
    color: white;
    word-break: break-word;
`;

const Row = styled.div<{ isPixelType?: boolean }>`
    display: flex;
    align-items: center;
    gap: ${props => (props.isPixelType ? '8' : '9')}px;
`;

const Chunks = styled.div<{ isPixelType?: boolean }>`
    display: flex;
    flex-direction: column;
    gap: ${props => (props.isPixelType ? '6' : '5')}px;
`;

export interface DeviceDisplayProps {
    address: string;
}

export const DeviceDisplay = ({ address }: DeviceDisplayProps) => {
    const unavailableCapabilities = useSelector(selectDeviceUnavailableCapabilities);
    const addressDisplay = useSelector(selectAddressDisplay);

    const areChunksUsed =
        addressDisplay === AddressDisplayOptions.CHUNKED && !unavailableCapabilities?.chunkify;
    const isPixelType = false;

    const chunkAddress = (address: string) => {
        const chunks = address.match(/.{1,4}/g);

        const groupedChunks = chunks?.reduce((result, chunk, index) => {
            const rowIndex = Math.floor(index / 4);

            if (!result[rowIndex]) {
                result[rowIndex] = [];
            }

            result[rowIndex].push(chunk);
            return result;
        }, [] as string[][]);

        const chunkedAddressRows = groupedChunks?.map((row, rowIndex) => (
            <Row key={rowIndex} isPixelType={isPixelType}>
                {row.map((chunk, chunkIndex) => (
                    <Text isPixelType={isPixelType} key={chunkIndex}>
                        {chunk}
                    </Text>
                ))}
            </Row>
        ));

        return <Chunks isPixelType={isPixelType}>{chunkedAddressRows}</Chunks>;
    };

    return (
        <Display>
            {areChunksUsed ? (
                chunkAddress(address as string)
            ) : (
                <Text isPixelType={isPixelType}>{address}</Text>
            )}
        </Display>
    );
};
