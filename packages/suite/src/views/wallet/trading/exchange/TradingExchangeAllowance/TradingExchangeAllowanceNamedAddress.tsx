import { type ReactNode } from 'react';

import { Address } from '@suite/address';
import { Column, Link, Row } from '@trezor/components';

type TradingExchangeAllowanceNamedAddressProps = {
    name: string;
    address: string;
    explorerLink: string | undefined;
    icon?: ReactNode;
};

/** A name with its icon and the address below, linked to the explorer. */
export const TradingExchangeAllowanceNamedAddress = ({
    name,
    address,
    explorerLink,
    icon,
}: TradingExchangeAllowanceNamedAddressProps) => (
    <Column alignItems="flex-end" gap={2}>
        <Row gap={8}>
            {icon}
            {name}
        </Row>
        <Link href={explorerLink}>
            <Address
                value={address}
                isTruncated
                isCopyAllowed
                isChunked={false}
                typographyStyle="body-xs"
                intent="neutral"
                priority="secondary"
            />
        </Link>
    </Column>
);
