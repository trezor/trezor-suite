import { selectSelectedAccount } from '@suite/account';
import { Translation } from '@suite/intl';
import { Banner, Column, H4 } from '@trezor/components';

import { hideCoinjoinReceiveWarning } from 'src/actions/suite/suiteActions';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const CoinjoinReceiveWarning = () => {
    const account = useSelector(selectSelectedAccount);
    const dispatch = useDispatch();

    if (!account) {
        return null;
    }

    return (
        <Banner
            icon
            rightContent={
                <Banner.Button onClick={() => dispatch(hideCoinjoinReceiveWarning())}>
                    <Translation id="TR_GOT_IT" />
                </Banner.Button>
            }
            description={
                <>
                    <H4>
                        <Translation id="TR_COINJOIN_RECEIVE_WARNING_TITLE" />
                    </H4>
                    <Column>
                        <Translation id="TR_COINJOIN_CEX_WARNING" />
                    </Column>
                </>
            }
        />
    );
};
