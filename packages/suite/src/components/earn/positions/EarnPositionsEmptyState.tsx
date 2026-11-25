import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { Button, Column, Paragraph, Text } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

export const EarnPositionsEmptyState = () => {
    const { dispatch } = useServices(injectDispatch);

    const onGoToEarnClick = () => {
        dispatch(gotoThunk({ routeName: 'suite-earn' }));
    };

    return (
        <Column alignItems="center" gap={12} margin={{ top: 48 }}>
            <Text typographyStyle="headline-sm">
                <Translation id="TR_EARN_NO_POSITIONS" />
            </Text>

            <Paragraph typographyStyle="body-md" intent="neutral" priority="secondary">
                <Translation id="TR_EARN_MY_POSITIONS_EMPTY_DESCRIPTION" />
            </Paragraph>

            <Button onClick={onGoToEarnClick} data-testid="@earn/positions/go-to-earn">
                <Translation id="TR_EARN_MY_POSITIONS_GO_TO_EARN" />
            </Button>
        </Column>
    );
};
