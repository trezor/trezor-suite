import React, { useContext } from 'react';
import { CoinmarketLayout } from '@wallet-components';
import CoinmarketAuthentication, {
    CoinmarketAuthenticationContext,
} from '@wallet-components/CoinmarketAuthentication';
import invityAPI from '@suite-services/invityAPI';

const CoinmarketSavingsRegistration = () => {
    const { whoAmI, fetching } = useContext(CoinmarketAuthenticationContext);
    return (
        <CoinmarketLayout>
            <CoinmarketAuthentication>
                {whoAmI && !fetching && !whoAmI.verified && (
                    <iframe
                        title="registration"
                        frameBorder="0"
                        src={invityAPI.getRegistrationPageSrc()}
                        sandbox="allow-scripts allow-forms allow-same-origin"
                    />
                )}
            </CoinmarketAuthentication>
        </CoinmarketLayout>
    );
};

export default CoinmarketSavingsRegistration;
