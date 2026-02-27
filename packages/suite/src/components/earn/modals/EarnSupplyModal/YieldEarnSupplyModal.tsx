import { Translation } from '@suite/intl';
import { EarnFlow } from '@suite-common/suite-types/src/staking';
import { selectTradingCoinSymbolByCryptoId, toTokenCryptoId } from '@suite-common/trading';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import { Modal } from '@trezor/components';

import { earnFlowToEventTypeMap } from 'src/constants/suite/staking';
import { useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

import { SupplyForm } from './SupplyForm/SupplyForm';

type YieldEarnSupplyModalProps = {
    onCancel?: () => void;
    account: Account;
    tokenContractAddress?: string;
};

export const YieldEarnSupplyModal = ({
    onCancel,
    account,
    tokenContractAddress,
}: YieldEarnSupplyModalProps) => {
    const analytics = useAnalytics();
    const normalizedTokenContractAddress = tokenContractAddress
        ? getContractAddressForNetworkSymbol(account.symbol, tokenContractAddress)
        : undefined;

    const tokenSymbolFromAccount = account.tokens?.find(
        token =>
            normalizedTokenContractAddress !== undefined &&
            token.contract !== undefined &&
            getContractAddressForNetworkSymbol(account.symbol, token.contract) ===
                normalizedTokenContractAddress,
    )?.symbol;

    const tokenCryptoId = normalizedTokenContractAddress
        ? toTokenCryptoId(account.symbol, normalizedTokenContractAddress)
        : undefined;

    const tokenSymbolFromTrading = useSelector(state =>
        selectTradingCoinSymbolByCryptoId(state, tokenCryptoId),
    );
    const displaySymbol = getNetworkDisplaySymbol(account.symbol);
    const supplySymbol = tokenSymbolFromAccount ?? tokenSymbolFromTrading ?? displaySymbol;

    const onCancelClick = () => {
        onCancel?.();

        analytics.report({
            type: earnFlowToEventTypeMap[EarnFlow.Yield],
            payload: {
                action: 'cancel',
                step: 'stake-form-modal',
                networkSymbol: account.symbol,
            },
        });
    };

    return (
        <Modal
            width={600}
            heading={<Translation id="TR_EARN_SUPPLY_TOKEN" values={{ symbol: supplySymbol }} />}
            onCancel={onCancelClick}
            bottomContent={
                <>
                    <Modal.Button isDisabled iconLeft="info">
                        <Translation id="TR_CONTINUE" />
                    </Modal.Button>
                    <Modal.Button intent="neutral" priority="secondary" onClick={onCancelClick}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <SupplyForm flow={EarnFlow.Yield} account={account} />
        </Modal>
    );
};
