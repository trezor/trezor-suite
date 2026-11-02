import { Translation } from '@suite/intl';
import { selectIsTorEnabled, selectIsTorLoading } from '@suite/tor';
import { toggleTorThunk } from '@suite/tor-desktop';
import { type AccountType } from '@suite-common/wallet-config';
import { Banner } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from 'src/hooks/suite';

type TorDisconnectedProps = {
    accountType?: AccountType;
};

export const TorDisconnected = ({ accountType }: TorDisconnectedProps) => {
    const isTorEnabled = useSelector(selectIsTorEnabled);
    const isTorLoading = useSelector(selectIsTorLoading);
    const { dispatch } = useServices(injectDispatch);

    if (accountType !== 'coinjoin' || isTorEnabled) return null;

    const handleButtonClick = () => dispatch(toggleTorThunk(true));

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
