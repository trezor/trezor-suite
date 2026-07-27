import { useDispatch } from 'react-redux';

import styled from 'styled-components';

import { coinjoinAccountToggleSkipRounds, selectCurrentCoinjoinSession } from '@suite/coinjoin';
import { Translation } from '@suite/intl';
import { H3, Paragraph, Switch, Text } from '@trezor/components';

import { useSelector } from 'src/hooks/suite/useSelector';

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
                    margin={{ top: 12 }}
                />
                <div>
                    <Text as="div" typographyStyle="body-md" margin={{ bottom: 4 }}>
                        <Translation id="TR_SKIP_ROUNDS_HEADING" />
                    </Text>
                    <Paragraph intent="neutral" priority="secondary" typographyStyle="body-sm">
                        <Translation id="TR_SKIP_ROUNDS_DESCRIPTION" />
                    </Paragraph>
                </div>
            </Row>
        </div>
    );
};
