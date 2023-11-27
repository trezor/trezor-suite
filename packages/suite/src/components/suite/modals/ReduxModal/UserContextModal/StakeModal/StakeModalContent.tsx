import styled from 'styled-components';
import { StakeEthFormContext, useStakeEthForm } from 'src/hooks/wallet/useStakeEthForm';
import { StakeEthForm } from './StakeEthForm';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';

const Flex = styled.div`
    display: flex;
    gap: 16px;
`;

const Left = styled.div`
    width: 100%;
`;

interface StakeModalContentProps {
    selectedAccount: SelectedAccountLoaded;
}

export const StakeModalContent = ({ selectedAccount }: StakeModalContentProps) => {
    const stakeEthContextValues = useStakeEthForm({ selectedAccount });

    return (
        <StakeEthFormContext.Provider value={stakeEthContextValues}>
            <Flex>
                <Left>
                    <StakeEthForm />
                </Left>

                {/*  TODO: Implement the right section with the rewards graph and staking info  */}
            </Flex>
        </StakeEthFormContext.Provider>
    );
};
