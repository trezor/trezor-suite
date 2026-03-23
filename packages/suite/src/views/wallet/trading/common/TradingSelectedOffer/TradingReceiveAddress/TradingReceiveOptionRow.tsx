import { type ReactNode } from 'react';

import { CardList } from '@trezor/components';

type TradingReceiveOptionRowProps = {
    children?: ReactNode;
    onClick?: () => void;
    isDisabled?: boolean;
    'data-testid'?: string;
};

export const TradingReceiveOptionRow = ({
    children,
    onClick,
    isDisabled = false,
    'data-testid': dataTestId,
}: TradingReceiveOptionRowProps) => (
    <CardList.Item
        data-testid={dataTestId}
        onClick={isDisabled ? undefined : onClick}
        isDisabled={isDisabled}
    >
        {children}
    </CardList.Item>
);
