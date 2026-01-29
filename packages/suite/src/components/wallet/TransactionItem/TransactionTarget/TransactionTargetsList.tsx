import {
    InternalTransfer as InternalTransferType,
    TokenTransfer as TokenTransferType,
} from '@trezor/blockchain-link-types';

import { WalletAccountTransaction } from 'src/types/wallet';

import { TransactionTarget } from './TransactionTarget';

export type CombinedTarget =
    | {
          type: 'token';
          payload: TokenTransferType;
      }
    | {
          type: 'internal';
          payload: InternalTransferType;
      }
    | {
          type: 'target';
          payload: WalletAccountTransaction['targets'][number];
      };

type TransactionTargetsListProps = {
    transaction: WalletAccountTransaction;
    allOutputs: CombinedTarget[];
    limit: number;
    defaultLimit: number;
    accountKey: string;
    isActionDisabled?: boolean;
    isPhishingTransaction?: boolean;
};

export const TransactionTargetsList = ({
    transaction,
    allOutputs,
    limit,
    defaultLimit,
    accountKey,
    isActionDisabled,
    isPhishingTransaction,
}: TransactionTargetsListProps) => {
    const previewTargets = allOutputs.slice(0, defaultLimit);

    const renderTarget = ({ target, i }: { target: CombinedTarget; i: number }) => {
        const commonProps = {
            ...target,
            transaction,
            accountKey,
            isActionDisabled,
            isPhishingTransaction,
        };

        return <TransactionTarget key={i} {...commonProps} />;
    };

    return (
        <>
            {previewTargets.map((target, i) =>
                renderTarget({
                    target,
                    i,
                }),
            )}
            {limit > 0 &&
                allOutputs.slice(defaultLimit, defaultLimit + limit).map((target, i) =>
                    renderTarget({
                        target,
                        i,
                    }),
                )}
        </>
    );
};
