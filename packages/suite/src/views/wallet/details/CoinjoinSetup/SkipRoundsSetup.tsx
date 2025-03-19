import { useDispatch } from 'react-redux';

import styled from 'styled-components';

import { H3, Paragraph, Switch, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { coinjoinAccountToggleSkipRounds } from 'src/actions/wallet/coinjoinAccountActions';
import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectCurrentCoinjoinSession } from 'src/reducers/wallet/coinjoinReducer';

const Row = styled.div`
    display: flex;
    gap: 12px;
    justify-content: space-between;
    margin-top: 16px;
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
            <H3>
                <Translation id="TR_SKIP_ROUNDS" />
            </H3>
            <Row>
                <Switch
                    isChecked={skipRounds}
                    isDisabled={!!session}
                    onChange={toggleSkipRounds}
                    margin={{ top: spacings.sm }}
                />
                <div>
                    <Text as="div" typographyStyle="body" margin={{ bottom: spacings.xxs }}>
                        <Translation id="TR_SKIP_ROUNDS_HEADING" />
                    </Text>
                    <Paragraph variant="tertiary" typographyStyle="hint">
                        <Translation id="TR_SKIP_ROUNDS_DESCRIPTION" />
                    </Paragraph>
                </div>
            </Row>
        </div>
    );
};
