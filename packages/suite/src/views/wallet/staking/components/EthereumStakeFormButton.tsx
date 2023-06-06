import React from 'react';
import styled from 'styled-components';

import { TooltipButton } from '@trezor/components';
import { useDevice, useSelector } from '@suite-hooks';
import { Translation } from '@suite-components/Translation';
import { useStakeFormContext } from '@wallet-hooks/useStakeForm';

const ButtonSubmit = styled(TooltipButton)`
    display: flex;
    flex-direction: column;
    margin: 32px auto;
    min-width: 200px;

    :disabled {
        background: ${({ theme }) => theme.STROKE_GREY};
    }
`;

export const EthereumStakeFormButton = () => {
    const { device, isLocked } = useDevice();

    const online = useSelector(state => state.suite.online);

    const { onSubmit, getValues, composedLevels } = useStakeFormContext();

    const values = getValues();
    const composedTx = composedLevels ? composedLevels[values.selectedFee || 'normal'] : undefined;
    const possibleToSubmit =
        composedTx?.type === 'final' && !isLocked() && device?.available && online;

    return (
        <ButtonSubmit
            tooltipContent={undefined}
            data-test="@stake/button"
            isDisabled={!possibleToSubmit}
            onClick={onSubmit}
        >
            <Translation id="STAKE_TRANSACTION" />
        </ButtonSubmit>
    );
};
