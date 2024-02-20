/* eslint-disable no-nested-ternary */
import styled from 'styled-components';

import { useSelector } from 'src/hooks/suite/useSelector';
import { AddressDisplayOptions, selectAddressDisplayType } from 'src/reducers/suite/suiteReducer';
import {
    selectDeviceInternalModel,
    selectDeviceUnavailableCapabilities,
} from '@suite-common/wallet-core';
import { DeviceModelInternal } from '@trezor/connect';
import { Icon, variables } from '@trezor/components';
import { splitStringEveryNCharacters } from '@trezor/utils';
import { Translation } from './Translation';
import { ClipboardEvent, Fragment, ReactElement, ReactNode } from 'react';
import {
    CHARACTER_OFFSET_FOR_ARROW,
    MAX_CHARACTERS_ON_ROW,
    MAX_CHARACTERS_ON_SCREEN,
} from 'src/constants/suite/device';

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

const Text = styled.div<{ isPixelType: boolean; isWithIndentation?: boolean }>`
    font-family: ${({ isPixelType }) => (isPixelType ? 'PixelOperatorMono8' : 'RobotoMono')},
        monospace;
    font-size: ${({ isPixelType }) => (isPixelType ? '12' : '18')}px;
    color: white;
    word-break: break-word;
    max-width: 216px;
    display: inline;
    ${({ isWithIndentation, isPixelType }) =>
        isWithIndentation &&
        `
            text-indent: ${isPixelType ? '36px' : '28px'};
    `}
`;

const Row = styled.div<{ isAlignedRight?: boolean }>`
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: ${({ isAlignedRight }) => (isAlignedRight ? 'flex-end' : 'flex-start')};
`;

const Chunks = styled.div`
    display: flex;
    flex-direction: column;
    gap: 5px;
`;

const Wrapper = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    height: 32px;
`;

const Divider = styled.div<{ areChunksUsed: boolean }>`
    width: 100%;
    height: 1px;
    background: #2b2b2b;
    margin: ${({ areChunksUsed }) => (areChunksUsed ? '20' : '0')}px 0;
`;

const AddressLabel = styled.span<{ areChunksUsed: boolean }>`
    font-weight: 600;
    color: #808080;
    font-size: ${variables.FONT_SIZE.TINY};
    text-transform: uppercase;
    position: relative;
    background: #000;
    padding: 0 10px;
    text-align: center;
    left: 50%;
    bottom: ${({ areChunksUsed }) => (areChunksUsed ? '12' : '-7')}px;
    transform: translate(-50%, 0);
`;

const StyledNextIcon = styled(Icon)<{ isPixelType: boolean }>`
    display: inline-block;
    margin-left: ${({ isPixelType }) => (isPixelType ? '2px' : '24px')};
`;

const StyledContinuesIcon = styled(Icon)<{ isPixelType: boolean }>`
    display: inline-block;
    margin-right: ${({ isPixelType }) => (isPixelType ? '2px' : '24px')};
`;

export interface DeviceDisplayProps {
    address: string;
    network?: string;
    valueDataTest?: string;
}

export const DeviceDisplay = ({ address, network, valueDataTest }: DeviceDisplayProps) => {
    const selectedDeviceInternalModel = useSelector(selectDeviceInternalModel);
    const unavailableCapabilities = useSelector(selectDeviceUnavailableCapabilities);
    const addressDisplayType = useSelector(selectAddressDisplayType);

    if (!selectedDeviceInternalModel) return null;

    // remove bitcoincash: prefix
    const processedAddress = address.startsWith('bitcoincash:')
        ? address.replace('bitcoincash:', '')
        : address;

    const isPaginated =
        MAX_CHARACTERS_ON_SCREEN[selectedDeviceInternalModel] <= processedAddress.length;

    const areChunksUsed =
        addressDisplayType === AddressDisplayOptions.CHUNKED &&
        !unavailableCapabilities?.chunkify &&
        valueDataTest !== '@xpub-modal/xpub-field' &&
        network !== 'cardano' &&
        (network !== 'solana' || valueDataTest === '@modal/confirm-address/address-field');

    const isPixelType = selectedDeviceInternalModel !== DeviceModelInternal.T2T1;
    const charsPerPage = MAX_CHARACTERS_ON_SCREEN[selectedDeviceInternalModel];
    const charsPerRow = MAX_CHARACTERS_ON_ROW[selectedDeviceInternalModel];
    const offsetForArrows = CHARACTER_OFFSET_FOR_ARROW[selectedDeviceInternalModel];

    const iconNextName = isPixelType ? 'ADDRESS_PIXEL_NEXT' : 'ADDRESS_NEXT';
    const iconContinuesName = isPixelType ? 'ADDRESS_PIXEL_CONTINUES' : 'ADDRESS_CONTINUES';
    const iconConfig = {
        size: isPixelType ? 10 : 20,
        color: isPixelType ? '#ffffff' : '#959596',
    };

    const showChunksInRows = (chunks: ReactNode[][] | undefined, isNextAddress?: boolean) =>
        chunks?.map((row, rowIndex) => (
            <Row key={rowIndex} isAlignedRight={rowIndex === 0 && isNextAddress}>
                {row.map((chunk, chunkIndex) => (
                    <Text isPixelType={isPixelType} key={chunkIndex} data-test="chunk">
                        {chunk}
                    </Text>
                ))}
            </Row>
        ));

    const renderChunks = (address: string) => {
        const chunks: Array<string | ReactElement> | null = address.match(/.{1,4}/g);

        const groupedChunks = chunks?.reduce((result, chunk, index) => {
            const rowIndex = Math.floor(index / 4);

            if (!result[rowIndex]) {
                result[rowIndex] = [];
            }

            result[rowIndex].push(chunk);

            return result;
        }, [] as ReactNode[][]);

        const handleOnCopy = (event: ClipboardEvent) => {
            const selectedText = window.getSelection()?.toString();

            if (selectedText) {
                const processedText = selectedText.replace(/\s/g, '');
                event?.nativeEvent?.clipboardData?.setData('text/plain', processedText);
                event.preventDefault();
            }
        };

        return (
            <Chunks onCopy={handleOnCopy} data-test={valueDataTest}>
                {showChunksInRows(groupedChunks)}
            </Chunks>
        );
    };

    const renderOriginal = (address: string) => {
        if (isPaginated) {
            const slices = splitStringEveryNCharacters(address, charsPerPage);

            const components = [];

            for (let i = 0; i < slices.length; i++) {
                const isFirstPage = i === 0;
                const isLastPage = i === slices.length - 1;
                const pageText = slices[i];

                const breakpointFirstLine = charsPerRow - (isFirstPage ? 0 : offsetForArrows);

                const firstRow = pageText.slice(0, breakpointFirstLine);
                const remainingRows = splitStringEveryNCharacters(
                    pageText.slice(breakpointFirstLine),
                    charsPerRow,
                );

                const rows = [firstRow, ...remainingRows];

                components.push(
                    <Text
                        key={`text-${i}`}
                        isPixelType={isPixelType}
                        data-test={isFirstPage ? valueDataTest : undefined}
                    >
                        {rows.map((row, index) => {
                            const isFirstLine = index !== 0;
                            const isLastLine = index === rows.length - 1;

                            return (
                                <>
                                    {isFirstLine ? <br /> : null}
                                    {isFirstLine && !isFirstPage ? (
                                        <StyledContinuesIcon
                                            {...iconConfig}
                                            isPixelType={isPixelType}
                                            icon={iconContinuesName}
                                        />
                                    ) : null}
                                    {row}
                                    {isLastLine && !isLastPage ? (
                                        <StyledNextIcon
                                            {...iconConfig}
                                            isPixelType={isPixelType}
                                            icon={iconNextName}
                                        />
                                    ) : null}
                                </>
                            );
                        })}
                    </Text>,
                );

                if (!isLastPage) {
                    components.push(
                        <Wrapper key={`separator-${i}`}>
                            <Divider areChunksUsed={areChunksUsed} />
                            <AddressLabel areChunksUsed={areChunksUsed}>
                                <Translation id="NEXT_PAGE" />
                            </AddressLabel>
                        </Wrapper>,
                    );
                }
            }

            return components;
        }

        return <Text isPixelType={isPixelType}>{address}</Text>;
    };

    return (
        <Display>
            {areChunksUsed ? renderChunks(processedAddress) : renderOriginal(processedAddress)}
        </Display>
    );
};
