import { type MouseEvent } from 'react';

import { selectIsFinpromRestricted } from '@suite/finprom';
import { Translation } from '@suite/intl';
import { Button } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

type EarnBuyButtonProps = {
    onClick: (event: MouseEvent<HTMLButtonElement>) => void;
    'data-testid'?: string;
};

export const EarnBuyButton = ({ onClick, 'data-testid': dataTestId }: EarnBuyButtonProps) => {
    const isFinpromRestricted = useSelector(selectIsFinpromRestricted);

    if (isFinpromRestricted) {
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
