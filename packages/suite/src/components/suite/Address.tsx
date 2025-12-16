import styled, { RuleSet, css } from 'styled-components';

import { DEFAULT_FLAGSHIP_MODEL } from '@suite-common/suite-constants';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { DeviceModelInternal } from '@trezor/device-utils';

import { useSelector } from 'src/hooks/suite';
import { selectAddressDisplayType } from 'src/selectors/suite/suiteSelectors';

const TRUNCATION_PLACEHOLDER = ' ... ';
const REGEXP_ADDRESS = /^(0x)?((.{8}).*(.{8})$)/;
const REGEXP_ADDRESS_CHUNKS = /((?:\S+\s){3}\S+)\s/g;

const mapDeviceModelToFontStyle = (deviceModelInternal: DeviceModelInternal): RuleSet<object> => {
    switch (deviceModelInternal) {
        case DeviceModelInternal.T1B1:
        case DeviceModelInternal.T2B1:
        case DeviceModelInternal.T3B1:
            return css`
                font-family: 'PixelOperatorMono8', monospace;
                font-size: 0.75em;
            `;
        case DeviceModelInternal.T2T1:
        case DeviceModelInternal.T3T1:
        case DeviceModelInternal.T3W1:
        default:
            return css`
                font-family: RobotoMono, monospace;
            `;
    }
};

const AddressWrapper = styled.p<{ $device?: DeviceModelInternal; $isChunked: boolean }>`
    letter-spacing: 0;
    word-break: ${({ $isChunked }) => ($isChunked ? 'normal' : 'break-all')};
    white-space: ${({ $isChunked }) => ($isChunked ? 'pre-line' : 'break-all')};

    ${({ $device }) => $device && mapDeviceModelToFontStyle($device)}
`;

const addSpacing = (value: string) => value?.match(/.{1,4}/g)?.join(' ') ?? value;
const addNewlineAfterEveryFourthChunk = (value: string) =>
    value?.replace(REGEXP_ADDRESS_CHUNKS, '$1\n') ?? value;

export type AddressProps = {
    value: string;
    isTruncated?: boolean;
    isChunked?: boolean;
    isDeviceRendered?: boolean;
    'data-testid'?: string;
};

export const Address = ({
    value,
    isTruncated,
    isChunked,
    isDeviceRendered = false,
    'data-testid': dataTestId,
}: AddressProps) => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const deviceModelInternal = selectedDevice?.features?.internal_model || DEFAULT_FLAGSHIP_MODEL;
    const isChunkedSettings = useSelector(selectAddressDisplayType);
    const isAddressChunked = isChunked ?? isChunkedSettings === 'chunked';
    const placeholder = isAddressChunked ? TRUNCATION_PLACEHOLDER : TRUNCATION_PLACEHOLDER.trim();

    const [, prefix = '', rest, beginning, end] = (value.match(REGEXP_ADDRESS) || []).map(part =>
        isAddressChunked ? addSpacing(part) : part,
    );

    const formattedValueBase = prefix + (isTruncated ? beginning + placeholder + end : rest);
    const formattedValue =
        isAddressChunked && isDeviceRendered && !isTruncated
            ? addNewlineAfterEveryFourthChunk(formattedValueBase)
            : formattedValueBase;

    const handleCopy = (e: React.ClipboardEvent) => {
        const selection = window.getSelection()?.toString();

        e.preventDefault();
        e.clipboardData?.setData('text/plain', selection?.replace(/\s/g, '') ?? value);
    };

    return (
        <AddressWrapper
            onCopy={handleCopy}
            data-testid={dataTestId}
            $device={isDeviceRendered ? deviceModelInternal : undefined}
            $isChunked={isAddressChunked}
        >
            {formattedValue ?? value}
        </AddressWrapper>
    );
};
