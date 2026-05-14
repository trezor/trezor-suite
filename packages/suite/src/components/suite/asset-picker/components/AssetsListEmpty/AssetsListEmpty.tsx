import { type ReactNode } from 'react';

import { Translation, type TranslationKey } from '@suite/intl';
import { openModal } from '@suite/modal';
import { selectSelectedDevice } from '@suite-common/device';
import { getNetworkSymbolForProtocol } from '@suite-common/suite-utils';
import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Button, Column, Paragraph } from '@trezor/components';

import { useDispatch, useSelector } from 'src/hooks/suite';

interface AssetsListEmptyProps {
    heading: TranslationKey;
    description?: TranslationKey;
    isEmpty: boolean;
    children: ReactNode;
    height?: string | number;
}

export const AssetsListEmpty = ({
    heading,
    description,
    isEmpty,
    children,
    height,
}: AssetsListEmptyProps) => {
    const dispatch = useDispatch();
    const protocolScheme = useSelector(state => state.protocol.sendForm.scheme);
    const device = useSelector(selectSelectedDevice);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const protocolSymbol = protocolScheme ? getNetworkSymbolForProtocol(protocolScheme) : undefined;
    const network = protocolSymbol ? getNetworkDisplaySymbolName(protocolSymbol) : undefined;

    const openActivateNetworkModal = () => {
        if (!protocolSymbol || !device) return;

        dispatch(openModal({ type: 'add-account', symbol: protocolSymbol, device }));
    };

    if (!isEmpty) {
        return <>{children}</>;
    }

    if (isEmpty && protocolScheme) {
        return (
            <Column
                alignItems="center"
                justifyContent="center"
                height="auto"
                margin={{ vertical: 32 }}
            >
                <Paragraph typographyStyle="body-md">
                    <Translation
                        id="TR_ACCOUNT_SEARCH_ACTIVATE_NETWORK_TITLE"
                        values={{ network }}
                    />
                </Paragraph>
                <Paragraph
                    textWrap="balance"
                    typographyStyle="body-sm"
                    intent="neutral"
                    priority="secondary"
                    align="center"
                    maxWidth={320}
                >
                    <Translation id="TR_ACCOUNT_SEARCH_ACTIVATE_NETWORK_DESC" />
                </Paragraph>
                <Button
                    onClick={openActivateNetworkModal}
                    margin={{ top: 32 }}
                    isLoading={isDiscoveryRunning}
                    intent="neutral"
                    priority="secondary"
                >
                    <Translation id="TR_ACCOUNT_SEARCH_ACTIVATE_NETWORK_CTA" values={{ network }} />
                </Button>
            </Column>
        );
    }

    return (
        <Column
            alignItems="center"
            justifyContent="center"
            gap={4}
            margin={{ vertical: 32 }}
            height={height}
        >
            <Paragraph typographyStyle="body-md">
                <Translation id={heading} />
            </Paragraph>
            {description && (
                <Paragraph
                    textWrap="balance"
                    align="center"
                    maxWidth={320}
                    intent="neutral"
                    priority="secondary"
                    typographyStyle="body-sm"
                >
                    <Translation id={description} />
                </Paragraph>
            )}
        </Column>
    );
};
