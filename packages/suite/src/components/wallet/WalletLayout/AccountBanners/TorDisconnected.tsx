import { Translation } from '@suite/intl';
import { selectModalType } from '@suite/modal';
import { Banner } from '@trezor/components';

import { toggleTor } from 'src/actions/suite/suiteActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { selectTorState } from 'src/selectors/suite/suiteSelectors';

export const TorDisconnected = () => {
    const account = useSelector(selectSelectedAccount);
    const { isTorEnabled, isTorLoading } = useSelector(selectTorState);
    const modalType = useSelector(selectModalType);
    const dispatch = useDispatch();

    if (account?.accountType !== 'coinjoin' || isTorEnabled) return null;

    const handleButtonClick = () => dispatch(toggleTor(true, modalType));

    return (
        <Banner
            intent="warning"
            rightContent={
                <Banner.Button onClick={handleButtonClick} isLoading={isTorLoading}>
                    {isTorLoading ? (
                        <Translation id="TR_ENABLING_TOR" />
                    ) : (
                        <Translation id="TR_TOR_ENABLE" />
                    )}
                </Banner.Button>
            }
            description={
                <Translation
                    id="TR_TOR_REQUEST_ENABLE_FOR_COIN_JOIN_TITLE"
                    values={{
                        b: chunks => <b>{chunks}</b>,
                    }}
                />
            }
        />
    );
};
