import React from 'react';
import styled from 'styled-components';
import { Button, colors } from '@trezor/components';
import { useDevice } from '@suite-hooks';
import { useSendFormContext } from '@wallet-hooks';
import { Translation } from '@suite-components/Translation';

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    margin: 25px 0;
    flex-direction: column;
`;

const ButtonReview = styled(Button)`
    min-width: 200px;
    margin-bottom: 5px;
`;

const Row = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    padding-bottom: 5px;
    color: ${colors.BLACK50};

    &:last-child {
        padding-bottom: 0;
    }
`;

export default () => {
    const { device, isLocked } = useDevice();
    const {
        online,
        isLoading,
        signTransaction,
        getValues,
        getDefaultValue,
        composedLevels,
    } = useSendFormContext();

    const values = getValues();
    const broadcastEnabled = getDefaultValue('options', []).includes('broadcast');
    const composedTx = composedLevels ? composedLevels[values.selectedFee || 'normal'] : undefined;
    const isDisabled =
        !composedTx ||
        composedTx.type !== 'final' ||
        isLocked() ||
        (device && !device.available) ||
        !online;

    return (
        <Wrapper>
            <Row>
                <ButtonReview
                    isDisabled={isDisabled}
                    isLoading={isLoading}
                    onClick={signTransaction}
                >
                    {broadcastEnabled ? (
                        <Translation id="TR_SEND_TRANSACTION" />
                    ) : (
                        <Translation id="TR_SIGN_TRANSACTION" />
                    )}
                </ButtonReview>
            </Row>
        </Wrapper>
    );
};
