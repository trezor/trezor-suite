import type {
    AccountInfo,
    MessageTypes,
    TokenInfo,
    Transaction,
} from '@trezor/blockchain-link-types';
import { RESPONSES } from '@trezor/blockchain-link-types';
import { solanaUtils } from '@trezor/blockchain-link-utils';
import { tokenProgramsInfo } from '@trezor/network-solana/constants';
import solana from '@trezor/network-solana/runtime';
import type { Address, Signature, SolanaTokenAccountInfo } from '@trezor/network-solana/types';
import { createDeferred, isNotNullOrUndefined } from '@trezor/utils';

import type { Request } from '../types';
import { fetchTransactionPage, getSignaturesForAddresses, isValidTransaction } from '../utils';

export const getAccountInfo = async (request: Request<MessageTypes.GetAccountInfo>) => {
    const { payload } = request;
    const { details = 'basic' } = payload;
    const api = await request.connect();
    const { address, getSolanaStakingData } = await solana();

    const publicKey = address(payload.descriptor);

    const { value: accountInfo } = await api.rpc
        .getAccountInfo(publicKey, { encoding: 'base64' })
        .send();

    const tokenMetadata = await request.getTokenMetadata();

    const getTokenAccountsForProgram = (programPublicKey: string) =>
        api.rpc
            .getTokenAccountsByOwner(
                publicKey,
                { programId: address(programPublicKey) } /* filter */,
                { encoding: 'jsonParsed' },
            )
            .send();

    const tokenAccounts = (
        await Promise.all(
            Object.values(tokenProgramsInfo).map(programInfo =>
                getTokenAccountsForProgram(programInfo.publicKey),
            ),
        )
    )
        .map(res => res.value)
        .flat();

    const recognisedWithBalance = tokenAccounts.filter(acc => {
        const info = acc.account.data.parsed?.info;
        const mint = info?.mint;
        const amount = info?.tokenAmount?.amount;

        return mint && tokenMetadata[mint] && amount !== '0';
    });

    const recognizedAccountsPubkeys = recognisedWithBalance.map(a => a.pubkey);

    const getAllTxIds = async (tokenAccountPubkeys: string[]) => {
        const sortedTokenAccountPubkeys = [...tokenAccountPubkeys].sort();

        const allAccounts = [payload.descriptor, ...sortedTokenAccountPubkeys];

        const allTxIds =
            details === 'txs' || details === 'txids'
                ? Array.from(
                      new Set(
                          (await getSignaturesForAddresses(api, allAccounts, request.state.cache))
                              .flat()
                              .sort((a, b) => Number(b.slot - a.slot))
                              .map(it => it.signature),
                      ),
                  )
                : [];

        return allTxIds;
    };

    const getEpoch = async (): Promise<number> => {
        const cachedEpoch = await request.state.cache.get('epoch');

        if (cachedEpoch) {
            return cachedEpoch;
        }

        // for parallel requests we store the promise in the cache immediately
        const deferred = createDeferred<number>();
        request.state.cache.set('epoch', deferred.promise, 3_600_000);

        const { epoch } = await api.rpc.getEpochInfo().send();
        deferred.resolve(Number(epoch));

        return deferred.promise;
    };

    // Fetch token info only if the account owns tokens
    let tokens: TokenInfo[] = [];
    if (tokenAccounts.length > 0) {
        tokens = solanaUtils.transformTokenInfo(tokenAccounts, tokenMetadata);
    }

    if (details === 'txids') {
        const txids = await getAllTxIds(recognizedAccountsPubkeys);
        const solEpoch = await getEpoch();

        const account: AccountInfo = {
            descriptor: payload.descriptor,
            balance: '0',
            availableBalance: '0',
            empty: txids.length === 0,
            history: {
                total: txids.length,
                unconfirmed: 0,
                txids,
            },
            tokens,
            misc: { solEpoch },
        };

        return {
            type: RESPONSES.GET_ACCOUNT_INFO,
            payload: account,
        } as const;
    }

    // token account's owner is the wallet
    const getATAOwnerAddress = async (address: Address) => {
        const { value: accountInfo } = await api.rpc
            .getAccountInfo(address, {
                encoding: 'jsonParsed',
            })
            .send();

        if (!accountInfo?.data || 'parsed' in accountInfo.data === false) {
            return address;
        }

        return (accountInfo.data.parsed?.info as { owner?: string })?.owner ?? address;
    };

    const getTransactionPage = async (
        txIds: Signature[],
        tokenAccountsInfos: SolanaTokenAccountInfo[],
    ) => {
        if (txIds.length === 0) {
            return [];
        }

        const transactionsPage = await fetchTransactionPage(api, txIds);

        const page = transactionsPage
            .filter(isValidTransaction)
            .map(tx =>
                solanaUtils.transformTransaction(
                    tx,
                    payload.descriptor,
                    tokenAccountsInfos,
                    tokenMetadata,
                ),
            )
            .filter(isNotNullOrUndefined);

        const transactions: Transaction[] = await Promise.all(
            page.map(async tx => {
                const tokens = await Promise.all(
                    tx.tokens.map(async transfer => {
                        // token account address is derived from the wallet address who is owner of that account
                        const from =
                            transfer.from !== payload.descriptor
                                ? await getATAOwnerAddress(address(transfer.from))
                                : transfer.from;
                        const to =
                            transfer.to !== payload.descriptor
                                ? await getATAOwnerAddress(address(transfer.to))
                                : transfer.to;

                        return {
                            ...transfer,
                            from,
                            to,
                        };
                    }),
                );

                return { ...tx, tokens };
            }),
        );

        return transactions;
    };

    const allTxIds = await getAllTxIds(recognizedAccountsPubkeys);

    const pageNumber = payload.page ? payload.page - 1 : 0;
    // for the first page of txs, payload.page is undefined, for the second page is 2
    const pageSize = payload.pageSize || 5;

    const pageStartIndex = pageNumber * pageSize;
    const pageEndIndex = Math.min(pageStartIndex + pageSize, allTxIds.length);

    const txIdPage = allTxIds.slice(pageStartIndex, pageEndIndex);

    const tokenAccountsInfos = tokenAccounts.map(a => ({
        address: a.pubkey,
        mint: a.account.data.parsed?.info?.mint,
        decimals: a.account.data.parsed?.info?.tokenAmount?.decimals,
    }));

    const transactionPage =
        details === 'txs' ? await getTransactionPage(txIdPage, tokenAccountsInfos) : undefined;

    const { value: balance } = await api.rpc.getBalance(publicKey).send();

    let misc: AccountInfo['misc'] | undefined;

    // Not necessary for basic and tokens details
    if (!['basic', 'tokens'].includes(details)) {
        const solEpoch = await getEpoch();
        const [solStakingAccounts, solExternalStakingAccounts] = await Promise.all([
            getSolanaStakingData(api?.rpc, publicKey, solEpoch, 'everstake'),
            getSolanaStakingData(api?.rpc, publicKey, solEpoch, 'non-everstake'),
        ]);

        misc = {
            solStakingAccounts,
            solExternalStakingAccounts,
            solEpoch,
        };

        if (accountInfo) {
            const [accountDataEncoded] = accountInfo.data;
            const accountDataBytes = Buffer.from(accountDataEncoded, 'base64'); // Previously `getBase64Encoder().encode(bytes)` was used
            const accountDataLength = BigInt(accountDataBytes.byteLength);
            const rent = await api.rpc.getMinimumBalanceForRentExemption(accountDataLength).send();

            misc.rent = Number(rent);
        }
    }

    // allTxIds can be empty for non-archive rpc nodes
    const isAccountEmpty = !(allTxIds.length || balance || tokens.length);

    const account: AccountInfo = {
        descriptor: payload.descriptor,
        balance: balance.toString(),
        availableBalance: balance.toString(),
        empty: isAccountEmpty,
        history: {
            total: allTxIds.length,
            unconfirmed: 0,
            transactions: transactionPage,
            txids: txIdPage,
        },
        page: transactionPage
            ? {
                  total: allTxIds.length,
                  index: pageNumber,
                  size: transactionPage.length,
              }
            : undefined,
        tokens,
        misc: { ...misc, owner: accountInfo?.owner },
    };

    return {
        type: RESPONSES.GET_ACCOUNT_INFO,
        payload: account,
    } as const;
};
