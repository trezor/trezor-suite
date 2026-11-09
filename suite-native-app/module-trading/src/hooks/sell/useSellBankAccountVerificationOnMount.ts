import { useEffect, useEffectEvent } from 'react';

type UseSellBankAccountVerificationOnMountProps = {
    doBankAccountVerificationCheck: () => void;
};

export const useSellBankAccountVerificationOnMount = ({
    doBankAccountVerificationCheck,
}: UseSellBankAccountVerificationOnMountProps) => {
    const runBankAccountVerificationCheck = useEffectEvent(() => {
        doBankAccountVerificationCheck();
    });

    useEffect(() => {
        runBankAccountVerificationCheck();
    }, []);
};
