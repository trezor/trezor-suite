import styled, { type RuleSet, css } from 'styled-components';

import { selectSelectedDevice } from '@suite-common/device';
import { AddressFormatter } from '@suite-common/formatters';
import { DEFAULT_FLAGSHIP_MODEL } from '@suite-common/suite-constants';
import { selectAddressDisplayType } from '@suite-common/wallet-core';
import { IconButton, Row, Text, type TextProps, Tooltip } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/device-utils';
import { type TypographyStyle } from '@trezor/theme';

import { copyAddressToClipboard } from 'src/actions/suite/copyAddressActions';
import { useDispatch, useSelector } from 'src/hooks/suite';

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

const AddressWrapper = styled.p<{ $device?: DeviceModelInternal }>`
    ${({ $device }) =>
        $device &&
        css`
            ${mapDeviceModelToFontStyle($device)};
            white-space: pre-wrap;
        `};
`;

const addNewlineAfterEveryFourthChunk = (value: string) =>
    value?.replace(REGEXP_ADDRESS_CHUNKS, '$1\n') ?? value;

type AddressBaseProps = {
    value: string;
    isChunked?: boolean;
    'data-testid'?: string;
    typographyStyle?: TypographyStyle;
    intent?: TextProps['intent'];
    priority?: TextProps['priority'];
    isDisabled?: TextProps['isDisabled'];
    isCopyAllowed?: boolean;
    onCopy?: () => void;
};

type AddressDisplayProps =
    | {
          isTruncated?: boolean;
          isDeviceRendered?: false;
      }
    | {
          isTruncated?: false;
          isDeviceRendered: true;
      };

export type AddressProps = AddressBaseProps & AddressDisplayProps;

export const Address = ({
    value,
    isTruncated = false,
    isChunked,
    isDeviceRendered = false,
    typographyStyle,
    intent,
    priority,
    isDisabled,
    'data-testid': dataTestId,
    isCopyAllowed = false,
    onCopy,
}: AddressProps) => {
    const dispatch = useDispatch();
    const selectedDevice = useSelector(selectSelectedDevice);
    const deviceModelInternal = selectedDevice?.features?.internal_model || DEFAULT_FLAGSHIP_MODEL;
    const isChunkedSettings = useSelector(selectAddressDisplayType);
    const isAddressChunked = isChunked ?? isChunkedSettings === 'chunked';

    const formattedValue = AddressFormatter.format(value, {
        format: isTruncated ? 'long' : 'full',
        isChunked: isAddressChunked,
    });
    const formattedValueFull = AddressFormatter.format(value, {
        format: 'full',
        isChunked: isAddressChunked,
    });

    const deviceRenderedIndent = isAddressChunked && value.startsWith('0x') ? '  ' : '';
    const deviceRenderedValue =
        deviceRenderedIndent + addNewlineAfterEveryFourthChunk(formattedValueFull);

    const onManualCopy = (e: React.ClipboardEvent) => {
        const selection = window.getSelection()?.toString();

        e.preventDefault();
        e.clipboardData?.setData('text/plain', selection?.replace(/\s/g, '') ?? value);
    };

    return (
        <Tooltip
            isActive={isTruncated && isCopyAllowed}
            content={
                <Row gap={8}>
                    <Text onCopy={onManualCopy}>{formattedValueFull}</Text>
                    <IconButton
                        icon="copy"
                        size="small"
                        intent="neutral"
                        priority="secondary"
                        onClick={e => {
                            e.stopPropagation();

                            if (onCopy) {
                                onCopy();
                            } else {
                                dispatch(copyAddressToClipboard(value));
                            }
                        }}
                    />
                </Row>
            }
            display="inline-flex"
        >
            <Text
                typographyStyle={typographyStyle}
                intent={intent}
                priority={priority}
                isDisabled={isDisabled}
                isTabular
                overflowWrap="anywhere"
            >
                <AddressWrapper
                    onCopy={onManualCopy}
                    data-testid={dataTestId}
                    id={value}
                    $device={isDeviceRendered ? deviceModelInternal : undefined}
                >
                    {isDeviceRendered ? deviceRenderedValue : formattedValue}
                </AddressWrapper>
            </Text>
        </Tooltip>
    );
};
