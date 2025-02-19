import { AnimatePresence } from 'framer-motion';

import {
    InternalTransfer as InternalTransferType,
    TokenTransfer as TokenTransferType,
} from '@trezor/blockchain-link-types';

import { AccountLabels } from 'src/types/suite/metadata';
import { WalletAccountTransaction } from 'src/types/wallet';

import { BlurWrapper } from '../TransactionItemBlurWrapper';
import { InternalTransfer, TokenTransfer, TransactionTarget } from './TransactionTarget';

type CombinedTarget =
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

interface TransactionTargetsListProps {
    transaction: WalletAccountTransaction;
    allOutputs: CombinedTarget[];
    limit: number;
    defaultLimit: number;
    accountKey: string;
    accountMetadata?: AccountLabels;
    useSingleRowLayout: boolean;
    isPhishingTransaction: boolean;
    isActionDisabled?: boolean;
}

export const TransactionTargetsList = ({
    transaction,
    allOutputs,
    limit,
    defaultLimit,
    useSingleRowLayout,
    accountKey,
    accountMetadata,
    isActionDisabled,
    isPhishingTransaction,
}: TransactionTargetsListProps) => {
    const previewTargets = allOutputs.slice(0, defaultLimit);

    const renderTarget = ({
        target,
        i,
        isLast,
        useAnimation,
    }: {
        target: CombinedTarget;
        i: number;
        isLast: boolean;
        useAnimation?: boolean;
    }) => {
        const commonProps = {
            transaction,
            isFirst: i === 0,
            isLast,
            singleRowLayout: useSingleRowLayout,
            accountMetadata,
            accountKey,
            isActionDisabled,
            isPhishingTransaction,
            useAnimation,
        };

        return (
            <BlurWrapper $isBlurred={isPhishingTransaction} key={i}>
                {target.type === 'target' && (
                    <TransactionTarget target={target.payload} {...commonProps} />
                )}
                {target.type === 'token' && (
                    <TokenTransfer transfer={target.payload} {...commonProps} />
                )}
                {target.type === 'internal' && (
                    <InternalTransfer transfer={target.payload} {...commonProps} />
                )}
            </BlurWrapper>
        );
    };

    return (
        <>
            {previewTargets.map((target, i) =>
                renderTarget({
                    target,
                    i,
                    isLast: limit > 0 ? false : i === previewTargets.length - 1,
                }),
            )}
            <AnimatePresence initial={false}>
                {limit > 0 &&
                    allOutputs.slice(defaultLimit, defaultLimit + limit).map((target, i) =>
                        renderTarget({
                            target,
                            i,
                            // if list is not fully expanded, an index of last is limit (num of currently showed items) - 1,
                            // otherwise the index is calculated as num of all targets - num of targets that are always shown (DEFAULT_LIMIT) - 1
                            isLast:
                                allOutputs.length > limit + defaultLimit
                                    ? i === limit - 1
                                    : i === allOutputs.length - defaultLimit - 1,
                            useAnimation: true,
                        }),
                    )}
            </AnimatePresence>
        </>
    );
};
