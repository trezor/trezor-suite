import { Banner } from '@trezor/components';

import { useYieldVaultDetail } from './useYieldVaultDetail';

export const YieldVaultDetailBanners = () => {
    const { messageSystem } = useYieldVaultDetail();

    return (
        <>
            {messageSystem.deposit.isDisabled && (
                <Banner
                    intent={messageSystem.deposit.variant}
                    description={messageSystem.deposit.content}
                />
            )}

            {messageSystem.withdraw.isDisabled && (
                <Banner
                    intent={messageSystem.withdraw.variant}
                    description={messageSystem.withdraw.content}
                />
            )}
        </>
    );
};
