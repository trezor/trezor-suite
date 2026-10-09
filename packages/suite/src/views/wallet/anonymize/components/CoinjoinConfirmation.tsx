import { useState } from 'react';
import { FormattedNumber } from 'react-intl';

import styled from 'styled-components';

import {
    selectCoinjoinClient,
    selectStartCoinjoinSessionArguments,
    startCoinjoinSessionThunk,
} from '@suite/coinjoin';
import { Translation } from '@suite/intl';
import { injectDispatch } from '@suite-common/redux-utils';
import { type Account } from '@suite-common/wallet-types';
import { Button, Card, H3, Note, Paragraph, Tooltip, variables } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { CircuitryIcon, ClockIcon, LockKeyIcon } from '@trezor/icons';

import { Error } from 'src/components/suite/Error';
import { useCoinjoinSessionBlockers } from 'src/hooks/coinjoin/useCoinjoinSessionBlockers';
import { useSelector } from 'src/hooks/suite';

import { Tile, type TileProps } from './Tile';

const TopFeeRow = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
`;

const FeeWrapper = styled.div`
    border-top: 1px solid ${({ theme }) => theme.borderNeutral};
    margin-top: 24px;
    padding-top: 16px;
`;

const Tiles = styled.div`
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(3, 1fr);

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        grid-template-columns: none;
    }
`;

const tiles: Array<TileProps & { id: string }> = [
    {
        id: 'clock',
        title: <Translation id="TR_COINJOIN_TILE_1_TITLE" />,
        description: <Translation id="TR_COINJOIN_TILE_1_DESCRIPTION" />,
        iconName: ClockIcon,
    },
    {
        id: 'circuitry',
        title: <Translation id="TR_COINJOIN_TILE_2_TITLE" />,
        description: <Translation id="TR_COINJOIN_TILE_2_DESCRIPTION" />,
        iconName: CircuitryIcon,
    },
    {
        id: 'lock',
        title: <Translation id="TR_COINJOIN_TILE_3_TITLE" />,
        description: <Translation id="TR_COINJOIN_TILE_3_DESCRIPTION" />,
        iconName: LockKeyIcon,
    },
];

interface CoinjoinConfirmationProps {
    account: Account;
}

export const CoinjoinConfirmation = ({ account }: CoinjoinConfirmationProps) => {
    const [isLoading, setIsLoading] = useState(false);

    const coinjoinClient = useSelector(state => selectCoinjoinClient(state, account.key));
    const startCoinjoinArgs = useSelector(state =>
        selectStartCoinjoinSessionArguments(state, account.key),
    );

    const { dispatch } = useServices(injectDispatch);

    const { coinjoinSessionBlockedMessage, isCoinjoinSessionBlocked } = useCoinjoinSessionBlockers(
        account.key,
    );

    if (!coinjoinClient || !startCoinjoinArgs) {
        return (
            <Error
                error={`Suite could not ${
                    coinjoinClient ? 'determine setup values' : 'connect to coordinator'
                }.`}
            />
        );
    }

    const isDisabled = isCoinjoinSessionBlocked;

    const getButtonTooltipMessage = () => {
        if (coinjoinSessionBlockedMessage) {
            return coinjoinSessionBlockedMessage;
        }
    };
    const anonymize = async () => {
        setIsLoading(true);
        await dispatch(startCoinjoinSessionThunk(...startCoinjoinArgs));
        setIsLoading(false);
    };

    return (
        <>
            <Card>
                <H3 margin={{ bottom: 32 }}>
                    <Translation id="TR_COINJOIN_SETUP" />
                </H3>
                <Tiles>
                    {tiles.map(({ id, ...tile }) => (
                        <Tile key={id} {...tile} />
                    ))}
                </Tiles>
                <FeeWrapper>
                    <TopFeeRow>
                        <Paragraph
                            typographyStyle="body-md-strong"
                            intent="neutral"
                            priority="secondary"
                        >
                            <Translation id="TR_SERVICE_FEE" />
                        </Paragraph>
                        <Paragraph typographyStyle="body-md-strong">
                            <FormattedNumber
                                value={coinjoinClient.coordinationFeeRate.rate}
                                style="percent"
                                maximumFractionDigits={3}
                            />
                        </Paragraph>
                    </TopFeeRow>
                    <Note>
                        <Translation id="TR_SERVICE_FEE_NOTE" />
                    </Note>
                </FeeWrapper>
            </Card>

            <Tooltip content={getButtonTooltipMessage()} width="fit-content">
                <Button onClick={anonymize} isDisabled={isDisabled} isLoading={isLoading}>
                    <Translation id="TR_START_COINJOIN" />
                </Button>
            </Tooltip>
        </>
    );
};
