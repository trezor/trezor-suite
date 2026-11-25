import { Translation, useTranslation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { IconButton, Row } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { CaretLeftIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

import { BasicName } from './BasicName';

export const EarnPositionsName = () => {
    const { dispatch } = useServices(injectDispatch);
    const { translationString } = useTranslation();

    const onBackButtonClick = () => {
        dispatch(gotoThunk({ routeName: 'suite-earn' }));
    };

    return (
        <Row alignItems="center" gap={16}>
            <IconButton
                icon={CaretLeftIcon}
                intent="neutral"
                priority="secondary"
                size="large"
                onClick={onBackButtonClick}
                data-testid="@earn/positions/back"
                aria-label={translationString('TR_BACK')}
                tooltip={{ content: <Translation id="TR_BACK" /> }}
            />

            <BasicName>
                <Translation id="TR_EARN_MY_POSITIONS" />
            </BasicName>
        </Row>
    );
};
