import { type ClipboardEvent, type KeyboardEvent, type MouseEvent, type ReactElement } from 'react';

import { copyAddressToClipboard, showCopyAddressModal } from '@suite/address';
import { events, injectDesktopAnalytics } from '@suite/analytics';
import { selectIsCopyAddressModalShown } from '@suite/flags';
import { Translation } from '@suite/intl';
import { COPY_TO_CLIPBOARD_TYPE_BY_ADDRESS_TYPE } from '@suite-common/analytics';
import { AddressFormatter } from '@suite-common/formatters';
import { Box, Column, Icon, Row, Text, Tooltip } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { CopyIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from 'src/hooks/suite';

import { type AssetAddressField } from './getAssetAddressFields';

type AssetDetailMenuAddressFieldProps = {
    field: AssetAddressField;
    label: ReactElement;
    onCopy: () => void;
};

export const AssetDetailMenuAddressField = ({
    field,
    label,
    onCopy,
}: AssetDetailMenuAddressFieldProps) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const shouldShowCopyAddressModal = useSelector(selectIsCopyAddressModalShown);

    const copyAddress = (e: MouseEvent | KeyboardEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (shouldShowCopyAddressModal) {
            dispatch(
                showCopyAddressModal(field.value, field.type, {
                    copyAnalyticsFrom: 'asset-detail',
                }),
            );
        } else {
            dispatch(copyAddressToClipboard(field.value));
            analytics.report({
                type: events.appCopyToClipboardEvent.name,
                payload: {
                    from: 'asset-detail',
                    type: COPY_TO_CLIPBOARD_TYPE_BY_ADDRESS_TYPE[field.type],
                },
            });
        }
        onCopy();
    };

    const copyFullValue = (e: ClipboardEvent) => {
        e.preventDefault();
        e.clipboardData.setData('text/plain', field.value);
    };

    return (
        <Column gap={8} padding={{ vertical: 8, horizontal: 12 }} alignItems="stretch">
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                {label}
            </Text>
            <Box
                padding={{ vertical: 10, horizontal: 12 }}
                borderRadius={12}
                backgroundColor="elementFillField"
            >
                <Row gap={12} justifyContent="space-between">
                    <Text
                        intent="neutral"
                        onCopy={copyFullValue}
                        data-testid={`@asset-detail/menu/${field.type}`}
                    >
                        {AddressFormatter.format(field.value, { format: 'long', isChunked: false })}
                    </Text>
                    <Tooltip content={<Translation id="TR_COPY_TO_CLIPBOARD" />}>
                        <Icon
                            as={CopyIcon}
                            size={20}
                            intent="neutral"
                            onClick={copyAddress}
                            data-testid={`@asset-detail/menu/${field.type}/copy`}
                        />
                    </Tooltip>
                </Row>
            </Box>
        </Column>
    );
};
