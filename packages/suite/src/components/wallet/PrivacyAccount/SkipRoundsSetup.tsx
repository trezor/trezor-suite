import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite/useSelector';
import { Switch, variables } from '@trezor/components';
import { coinjoinAccountToggleSkipRounds } from 'src/actions/wallet/coinjoinAccountActions';
import { selectCurrentCoinjoinSession } from 'src/reducers/wallet/coinjoinReducer';

const Row = styled.div`
    display: flex;
    gap: 12px;
    justify-content: space-between;
    margin-top: 16px;
`;

const Heading = styled.div`
    font-size: ${variables.FONT_SIZE.H3};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Subheading = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin-bottom: 3px;
`;

const Text = styled.p`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StyledSwitch = styled(Switch)`
    margin-top: 10px;
`;

interface SkipRoundsSetupProps {
    accountKey: string;
    skipRounds: boolean;
}

export const SkipRoundsSetup = ({ accountKey, skipRounds }: SkipRoundsSetupProps) => {
    const session = useSelector(selectCurrentCoinjoinSession);

    const dispatch = useDispatch();

    const toggleSkipRounds = () => dispatch(coinjoinAccountToggleSkipRounds(accountKey));

    return (
        <div>
            <Heading>
                <Translation id="TR_SKIP_ROUNDS" />
            </Heading>
            <Row>
                <StyledSwitch
                    isChecked={skipRounds}
                    isDisabled={!!session}
                    onChange={toggleSkipRounds}
                />
                <div>
                    <Subheading>
                        <Translation id="TR_SKIP_ROUNDS_HEADING" />
                    </Subheading>
                    <Text>
                        <Translation id="TR_SKIP_ROUNDS_DESCRIPTION" />
                    </Text>
                </div>
            </Row>
        </div>
    );
};
