import { selectSelectedAccount } from '@suite/account';
import { Translation } from '@suite/intl';
import { injectDispatch } from '@suite-common/redux-utils';
import { Banner, Column } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';

import { hideCoinjoinReceiveWarning } from 'src/actions/suite/suiteActions';
import { useSelector } from 'src/hooks/suite';

export const CoinjoinReceiveWarning = () => {
    const account = useSelector(selectSelectedAccount);
    const { dispatch } = useServices(injectDispatch);

    if (!account) {
        return null;
    }

    return (
        <Banner
            icon
            title={<Translation id="TR_COINJOIN_RECEIVE_WARNING_TITLE" />}
            rightContent={
                <Banner.Button onClick={() => dispatch(hideCoinjoinReceiveWarning())}>
                    <Translation id="TR_GOT_IT" />
                </Banner.Button>
            }
            description={
                <Column>
                    <Translation id="TR_COINJOIN_CEX_WARNING" />
                    <Translation id="TR_UNECO_COINJOIN_RECEIVE_WARNING" />
                </Column>
            }
        />
    );
};
