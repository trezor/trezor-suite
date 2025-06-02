import styled, { RuleSet, css } from 'styled-components';

import { DEFAULT_FLAGSHIP_MODEL } from '@suite-common/suite-constants';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { DeviceModelInternal } from '@trezor/device-utils';

import { useSelector } from 'src/hooks/suite';
import { selectAddressDisplayType } from 'src/reducers/suite/suiteReducer';

const TRUNCATION_PLACEHOLDER = ' ... ';

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

const AddressWrapper = styled.p<{ $device: DeviceModelInternal; $isChunked: boolean }>`
    text-wrap: balance;
    letter-spacing: 0;
    word-break: ${({ $isChunked }) => ($isChunked ? 'normal' : 'break-all')};

    ${({ $device }) => mapDeviceModelToFontStyle($device)}
`;

const addSpacing = (value: string) => value.match(/.{1,4}/g)?.join(' ') || value;

export type AddressProps = {
    value: string;
    isTruncated?: boolean;
    isChunked?: boolean;
    'data-testid'?: string;
};

export const Address = ({
    value,
    isTruncated,
    isChunked,
    'data-testid': dataTestId,
}: AddressProps) => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const deviceModelInternal = selectedDevice?.features?.internal_model || DEFAULT_FLAGSHIP_MODEL;
    const isChunkedSettings = useSelector(selectAddressDisplayType);
    const isAddressChunked = isChunked ?? isChunkedSettings === 'chunked';
    const placeholder = isAddressChunked ? TRUNCATION_PLACEHOLDER : TRUNCATION_PLACEHOLDER.trim();

    const [full, beginning, middle, end] = (value.match(/^(.{8})(.*)(.{8})$/) || []).map(part =>
        isAddressChunked ? addSpacing(part) : part,
    );

    const formattedValue = isTruncated ? beginning + placeholder + end : full;

    const handleCopy = (e: React.ClipboardEvent) => {
        const selection = window.getSelection()?.toString();

        e.preventDefault();
        e.clipboardData?.setData(
            'text/plain',
            selection?.replace(placeholder, middle).replace(/\s/g, '') ?? value,
        );
    };

    return (
        <AddressWrapper
            onCopy={handleCopy}
            data-testid={dataTestId}
            $device={deviceModelInternal}
            $isChunked={isAddressChunked}
        >
            {formattedValue ?? value}
        </AddressWrapper>
    );
};
