import { useSelector } from 'react-redux';

import styled, { type RuleSet, css } from 'styled-components';

import { selectDeviceInternalModel } from '@suite-common/device';
import { AddressFormatter, clearAddressPrefix, getAddressChunks } from '@suite-common/formatters';
import { selectAddressDisplayType } from '@suite-common/wallet-core';
import { IconButton, Row, Text, type TextProps, Tooltip } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { DEFAULT_FLAGSHIP_MODEL } from '@trezor/device';
import { DeviceModelInternal } from '@trezor/device-utils';
import { CopyIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';
import { type TypographyStyle } from '@trezor/theme';

import { AddressChunks } from './AddressChunks';
import { copyAddressToClipboard } from './copyAddressActions';

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

const AddressWrapper = styled.p<{
    $device?: DeviceModelInternal;
    $isUnderlined: boolean;
    $hasDeviceIndent: boolean;
}>`
    ${({ $isUnderlined }) => $isUnderlined && 'text-decoration: underline;'}
    ${({ $device }) =>
        $device &&
        css`
            ${mapDeviceModelToFontStyle($device)};
            white-space: pre-wrap;
        `};
    ${({ $hasDeviceIndent }) =>
        $hasDeviceIndent &&
        css`
            &::before {
                content: '  ';
            }
        `}
`;

type AddressBaseProps = {
    value: string;
    isChunked?: boolean;
    'data-testid'?: string;
    typographyStyle?: TypographyStyle;
    intent?: TextProps['intent'];
    priority?: TextProps['priority'];
    isDisabled?: TextProps['isDisabled'];
    isCopyAllowed?: boolean;
    isUnderlined?: boolean;
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
    isUnderlined = false,
    onCopy,
}: AddressProps) => {
    const { dispatch } = useServices(injectDispatch);
    const deviceModelInternal = useSelector(selectDeviceInternalModel) || DEFAULT_FLAGSHIP_MODEL;
    const isChunkedSettings = useSelector(selectAddressDisplayType);
    const isAddressChunked = isChunked ?? isChunkedSettings === 'chunked';

    const addressWithoutPrefix = clearAddressPrefix(value);
    const displayFormat = isTruncated ? 'long' : 'full';
    const displayedChunks = isAddressChunked
        ? getAddressChunks(addressWithoutPrefix, displayFormat)
        : null;
    const displayedText = AddressFormatter.format(addressWithoutPrefix, {
        format: displayFormat,
        isChunked: false,
    });
    const fullChunks = isAddressChunked ? getAddressChunks(addressWithoutPrefix, 'full') : null;
    const fullText = AddressFormatter.format(addressWithoutPrefix, {
        format: 'full',
        isChunked: false,
    });
    const hasDeviceIndent = isDeviceRendered && displayedChunks !== null && value.startsWith('0x');

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
                    <Text onCopy={onManualCopy}>
                        <AddressChunks
                            chunks={fullChunks}
                            fallback={fullText}
                            isDeviceRendered={false}
                        />
                    </Text>
                    <IconButton
                        icon={CopyIcon}
                        size="small"
                        intent="neutral"
                        priority="secondary"
                        isInverse
                        onClick={e => {
                            e.stopPropagation();

                            if (onCopy) {
                                onCopy();
                            } else {
                                dispatch(copyAddressToClipboard(value));
                            }
                        }}
                        tooltip={{ isActive: false }}
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
                    $isUnderlined={isUnderlined}
                    $hasDeviceIndent={hasDeviceIndent}
                >
                    <AddressChunks
                        chunks={displayedChunks}
                        fallback={displayedText}
                        isDeviceRendered={isDeviceRendered}
                    />
                </AddressWrapper>
            </Text>
        </Tooltip>
    );
};
