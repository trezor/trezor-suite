import { useSendContext } from '@suite/hooks/wallet/useSendContext';
import { updateFeeOrNotify } from '@wallet-actions/sendFormActions';
import React, { useEffect } from 'react';
import styled from 'styled-components';

import Address from './components/Address';
import Amount from './components/Amount';
import Header from './components/Header';
import { useFormContext } from 'react-hook-form';

const Wrapper = styled.div``;

const OutputWrapper = styled.div`
    padding: 0 12px 12px 12px;
    margin-bottom: 20px;

    &:last-child {
        margin-bottom: 0;
    }
`;

const Row = styled.div`
    display: flex;
    flex-direction: ${(props: { isColumn?: boolean }) => (props.isColumn ? 'column' : 'row')};
    padding: 0 0 30px 0;

    &:last-child {
        padding: 0;
    }
`;

export default () => {
    const {
        outputs,
        coinFees,
        selectedFee,
        token,
        setSelectedFee,
        account,
        setFeeOutdated,
    } = useSendContext();
    const { setValue } = useFormContext();

    useEffect(() => {
        updateFeeOrNotify(
            account,
            coinFees,
            token,
            selectedFee,
            setFeeOutdated,
            setValue,
            setSelectedFee,
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [coinFees]);

    return (
        <Wrapper>
            {outputs.map((output, key: number) => (
                <OutputWrapper key={output.id}>
                    <Header outputIndex={key} outputId={output.id} />
                    <Row>
                        <Address outputId={output.id} />
                    </Row>
                    <Row>
                        <Amount outputId={output.id} />
                    </Row>
                </OutputWrapper>
            ))}
        </Wrapper>
    );
};
