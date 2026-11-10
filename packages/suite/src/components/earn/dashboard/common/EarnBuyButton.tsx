import { type MouseEvent } from 'react';

import { Translation } from '@suite/intl';
import { selectIsRegionRestricted } from '@suite/regions';
import { Button } from '@trezor/components';

import { useSelector } from '../../../../hooks/suite';

type EarnBuyButtonProps = {
    onClick: (event: MouseEvent<HTMLButtonElement>) => void;
    'data-testid'?: string;
};

export const EarnBuyButton = ({ onClick, 'data-testid': dataTestId }: EarnBuyButtonProps) => {
    const isRegionRestricted = useSelector(selectIsRegionRestricted);

    if (isRegionRestricted) {
        return null;
    }

    return (
        <Button
            data-testid={dataTestId}
            size="small"
            intent="neutral"
            priority="secondary"
            onClick={onClick}
        >
            <Translation id="TR_BUY" />
        </Button>
    );
};
