import React from 'react';
import { useSendContext } from '@suite/hooks/wallet/useSendContext';
import { useFormContext } from 'react-hook-form';
import styled from 'styled-components';

import EstimatedMiningTime from '../../../EstimatedMiningTime';
import Fee from '../Fee';
import Layout from '../Layout';
import Locktime from './components/Locktime';
import ReplaceByFee from './components/ReplaceByFee';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Row = styled.div`
    display: flex;
    margin-bottom: 35px;

    &:last-child {
        margin-bottom: 0;
    }
`;

export default () => {
    const { getValues } = useFormContext();
    const { selectedFee, fees } = useSendContext();
    const customFee = getValues('customFee');

    return (
        <Wrapper>
            <Layout
                left={
                    <>
                        <Row>
                            <Fee />
                        </Row>
                        {!customFee.value && (
                            <Row>
                                <EstimatedMiningTime
                                    seconds={fees.feeInfo.blockTime * selectedFee.blocks * 60}
                                />
                            </Row>
                        )}
                    </>
                }
                right={
                    <>
                        <Row>
                            <ReplaceByFee />
                        </Row>
                        <Row>
                            <Locktime />
                        </Row>
                    </>
                }
                bottom={null}
            />
        </Wrapper>
    );
};
