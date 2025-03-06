/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import {
  Address,
  Account,
  createAddressWithSeed,
  createDefaultRpcTransport,
  createSolanaRpcFromTransport,
  mainnet,
  devnet,
  ClusterUrl,
  address,
  TransactionMessageWithBlockhashLifetime,
  createNoopSigner,
  pipe,
  CompilableTransactionMessage,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  RpcFromTransport,
  SolanaRpcApiFromTransport,
  RpcTransportFromClusterUrl,
  IInstruction,
  generateKeyPair,
  createSignerFromKeyPair,
  partiallySignTransactionMessageWithSigners,
  parseBase64RpcAccount,
  prependTransactionMessageInstruction,
  getU8Decoder,
  getU32Encoder,
} from '@solana/web3.js';

import {
  getCreateAccountWithSeedInstruction,
  getCreateAccountInstruction,
  getTransferSolInstruction,
  getAllocateWithSeedInstruction,
} from '@solana-program/system';

import {
  getSetComputeUnitLimitInstruction,
  getSetComputeUnitPriceInstruction,
} from '@solana-program/compute-budget';

import { Blockchain } from './utils';
import { ERROR_MESSAGES } from './constants/errors';
import {
  DEVNET_VALIDATOR_ADDRESS,
  FILTER_DATA_SIZE,
  FILTER_OFFSET,
  MAINNET_VALIDATOR_ADDRESS,
  MIN_AMOUNT,
  Network,
  StakeState,
  STAKE_ACCOUNT_V2_SIZE,
  ADDRESS_DEFAULT,
  STAKE_HISTORY_ACCOUNT,
  STAKE_CONFIG_ACCOUNT,
} from './constants';
import {
  ApiResponse,
  CreateAccountResponse,
  ClaimResponse,
  StakeResponse,
  Delegations,
  UnstakeResponse,
  Params,
  RpcConfig,
} from './types';

import {
  getWithdrawInstruction,
  getDelegateStakeInstruction,
  getDeactivateInstruction,
  getInitializeInstruction,
  getSplitInstruction,
  STAKE_PROGRAM_ADDRESS,
  decodeStakeStateAccount,
  StakeStateAccount,
  StakeStateV2,
} from '@solana-program/stake';

/**
 * The `Solana` class extends the `Blockchain` class and provides methods for interacting with the Solana blockchain.
 *
 * @property connection - The connection to the Solana blockchain.
 * @property ERROR_MESSAGES - The error messages for the Solana class.
 * @property ORIGINAL_ERROR_MESSAGES - The original error messages for the Solana class.

 * @throws Throws an error if there's an issue establishing the connection.
 */
export class Solana extends Blockchain {
  private connection!: RpcFromTransport<
    SolanaRpcApiFromTransport<RpcTransportFromClusterUrl<ClusterUrl>>,
    RpcTransportFromClusterUrl<ClusterUrl>
  >;
  private validator: Address;
  protected ERROR_MESSAGES = ERROR_MESSAGES;
  protected ORIGINAL_ERROR_MESSAGES = {};

  constructor(network: Network = Network.Mainnet, rpcConfig: RpcConfig = {}) {
    super();
    if (rpcConfig.rpc && !this.isValidURL(rpcConfig.rpc)) {
      throw this.throwError('INVALID_RPC_ERROR');
    }

    switch (network) {
      case Network.Mainnet:
        rpcConfig.rpc =
          rpcConfig.rpc || mainnet('https://api.mainnet-beta.solana.com');
        this.validator = MAINNET_VALIDATOR_ADDRESS;
        break;
      case Network.Devnet:
        rpcConfig.rpc =
          rpcConfig.rpc || devnet('https://api.devnet.solana.com');
        this.validator = DEVNET_VALIDATOR_ADDRESS;
        break;
      default:
        throw this.throwError('UNSUPPORTED_NETWORK_ERROR');
    }

    try {
      const transport = createDefaultRpcTransport({
        url: rpcConfig.rpc,
        headers: {
          'User-Agent': rpcConfig.userAgent || '',
        },
      });

      this.connection = createSolanaRpcFromTransport(transport);
    } catch (error) {
      throw this.handleError('CONNECTION_ERROR', error);
    }
  }

  /**
   * Creates a new stake account.
   *
   * @param address - The public key of the account as PublicKey.
   * @param lamports  - The amount to stake in lamports.
   * @param source  - stake source
   * @param lockup - stake account lockup
   *
   * @throws  Throws an error if the lamports is less than the minimum amount.
   * @throws  Throws an error if there's an issue creating the stake account.
   *
   * @returns Returns a promise that resolves with the versioned transaction of the stake account creation and the public key of the stake account.
   *
   */
  public async createAccount(
    sender: string,
    amountInLamports: bigint,
    source: string,
    // lockup: Lockup | null = Lockup.default,
    params?: Params,
  ): Promise<ApiResponse<CreateAccountResponse>> {
    // Check if the amount is greater than or equal to the minimum amount
    if (amountInLamports < MIN_AMOUNT) {
      this.throwError('MIN_AMOUNT_ERROR', MIN_AMOUNT.toString());
    }

    try {
      // Get the minimum balance for rent exemption
      const minimumRent = await this.connection
        .getMinimumBalanceForRentExemption(
          //TODO get from account when it's would be available
          BigInt(STAKE_ACCOUNT_V2_SIZE),
        )
        .send();

      //  lockup = lockup || Lockup.default;

      const [
        createAccountInstruction,
        initializeInstruction,
        stakeAccountPubkey,
      ] =
        source === null
          ? // TODO fix create account sign
            await this.createAccountTx(
              address(sender),
              BigInt(amountInLamports) + minimumRent,
              // lockup,
            )
          : await this.createAccountWithSeedTx(
              address(sender),
              BigInt(amountInLamports) + minimumRent,
              source,
              // lockup,
            );

      let transactionMessage = await this.baseTx(sender, params);
      transactionMessage = appendTransactionMessageInstruction(
        createAccountInstruction,
        transactionMessage,
      );
      transactionMessage = appendTransactionMessageInstruction(
        initializeInstruction,
        transactionMessage,
      );
      const signedTransactionMessage =
        source === null
          ? await partiallySignTransactionMessageWithSigners(transactionMessage)
          : transactionMessage;

      return {
        result: {
          transaction: signedTransactionMessage,
          stakeAccount: stakeAccountPubkey,
        },
      };
    } catch (error) {
      throw this.handleError('CREATE_ACCOUNT_ERROR', error);
    }
  }

  /**
   * Delegates a specified amount from a stake account to a validator.
   *
   * @param address - The public key of the account.
   * @param lamports - The amount in lamports to be delegated.
   * @param stakeAccount - The public key of the stake account.
   *
   * @throws Throws an error if the amount is less than the minimum amount, or if there's an issue during the delegation process.
   *
   * @returns Returns a promise that resolves with the delegation transaction.
   *
   */
  public async delegate(
    sender: string,
    lamports: bigint,
    stakeAccount: string,
    params?: Params,
  ): Promise<ApiResponse<TransactionMessageWithBlockhashLifetime>> {
    if (lamports < MIN_AMOUNT) {
      this.throwError('MIN_AMOUNT_ERROR', MIN_AMOUNT.toString());
    }

    try {
      const delegateInstruction = repackInstruction(
        getDelegateStakeInstruction({
          stake: address(stakeAccount),
          vote: this.validator,
          stakeHistory: STAKE_HISTORY_ACCOUNT,
          unused: STAKE_CONFIG_ACCOUNT,
          stakeAuthority: createNoopSigner(address(sender)),
        }),
      );

      let transactionMessage = await this.baseTx(sender, params);
      transactionMessage = appendTransactionMessageInstruction(
        delegateInstruction,
        transactionMessage,
      );

      return { result: transactionMessage };
    } catch (error) {
      throw this.handleError('DELEGATE_ERROR', error);
    }
  }

  /**
   * Deactivates a stake account.
   *
   * @param address - The public key of the account.
   * @param stakeAccountPublicKey - The public key of the stake account.
   * @throws Throws an error if there's an issue during the deactivation process.
   * @returns Returns a promise that resolves with the deactivation transaction.
   *
   */
  public async deactivate(
    sender: string,
    stakeAccountPublicKey: string,
    params?: Params,
  ): Promise<ApiResponse<TransactionMessageWithBlockhashLifetime>> {
    try {
      const deactivateInstruction = repackInstruction(
        getDeactivateInstruction({
          stake: address(stakeAccountPublicKey),
          stakeAuthority: createNoopSigner(address(sender)),
        }),
      );
      let transactionMessage = await this.baseTx(sender, params);
      transactionMessage = appendTransactionMessageInstruction(
        deactivateInstruction,
        transactionMessage,
      );

      return { result: transactionMessage };
    } catch (error) {
      throw this.handleError('DEACTIVATE_ERROR', error);
    }
  }

  /**
   * Withdraws a specified amount from a stake account.
   *
   * @param address - The public key of the account.
   * @param stakeAccountPublicKey - The public key of the stake account.
   * @param stakeBalance - The amount in lamports to be withdrawn from the stake account.
   *
   * @throws Throws an error if there's an issue during the withdrawal process.
   *
   * @returns Returns a promise that resolves with the withdrawal transaction.
   *
   */
  public async withdraw(
    sender: Address,
    stakeAccountPublicKey: Address,
    stakeBalance: bigint,
    params?: Params,
  ): Promise<ApiResponse<TransactionMessageWithBlockhashLifetime>> {
    try {
      // Create the withdraw instruction
      const withdrawInstruction = repackInstruction(
        getWithdrawInstruction({
          stake: stakeAccountPublicKey,
          recipient: sender,
          stakeHistory: STAKE_HISTORY_ACCOUNT,
          withdrawAuthority: createNoopSigner(address(sender)),
          args: stakeBalance,
        }),
      );

      let transactionMessage = await this.baseTx(sender, params);
      transactionMessage = appendTransactionMessageInstruction(
        withdrawInstruction,
        transactionMessage,
      );

      return { result: transactionMessage };
    } catch (error) {
      throw this.handleError('WITHDRAW_ERROR', error);
    }
  }

  /**
   * Fetches the delegations of a given account.
   *
   * @param address - The public key of the account.
   *
   * @throws Throws an error if there's an issue fetching the delegations.
   *
   * @returns Returns a promise that resolves with the delegations of the account.
   *
   */
  public async getDelegations(
    address: string,
  ): Promise<ApiResponse<Delegations>> {
    try {
      // Fetch the accounts
      const accounts = await this.connection
        .getProgramAccounts(STAKE_PROGRAM_ADDRESS, {
          encoding: 'base64',
          filters: [
            {
              dataSize: FILTER_DATA_SIZE, // Token account size
            },
            {
              memcmp: {
                bytes: address,
                encoding: 'base58',
                offset: FILTER_OFFSET,
              },
            },
          ],
        })
        .send();

      const acs = accounts.map((account) => {
        const acc = parseBase64RpcAccount(account.pubkey, account.account);

        return decodeStakeStateAccount(acc);
      });

      return { result: acs };
    } catch (error) {
      throw this.handleError('GET_DELEGATIONS_ERROR', error);
    }
  }

  /**
   * Stakes a certain amount of lamports.
   *
   * @param sender - The public key of the sender.
   * @param lamports - The number of lamports to stake.
   * @param source  - stake source
   * @param lockup - stake account lockup
   * @returns A promise that resolves to a VersionedTransaction object.
   */
  async stake(
    sender: string,
    lamports: bigint,
    source: string,
    // lockup: Lockup | null = Lockup.default,
    params?: Params,
  ): Promise<ApiResponse<StakeResponse>> {
    try {
      //     lockup = lockup || Lockup.default;
      // Get the minimum balance for rent exemption
      const minimumRent = await this.connection
        .getMinimumBalanceForRentExemption(
          //TODO get from account when would be added
          BigInt(STAKE_ACCOUNT_V2_SIZE),
        )
        .send();

      const [
        createStakeAccountInstruction,
        initializeStakeAccountInstruction,
        stakeAccountPublicKey,
      ] =
        source === null
          ? // TODO fix create account sign
            await this.createAccountTx(
              address(sender),
              BigInt(lamports) + minimumRent,
              // lockup,
            )
          : await this.createAccountWithSeedTx(
              address(sender),
              BigInt(lamports) + minimumRent,
              source,
              // lockup,
            );

      const delegateInstruction = repackInstruction(
        getDelegateStakeInstruction({
          stake: stakeAccountPublicKey,
          vote: this.validator,
          stakeHistory: STAKE_HISTORY_ACCOUNT,
          unused: STAKE_CONFIG_ACCOUNT,
          stakeAuthority: createNoopSigner(address(sender)),
        }),
      );

      let transactionMessage = await this.baseTx(sender, params);
      transactionMessage = appendTransactionMessageInstruction(
        createStakeAccountInstruction,
        transactionMessage,
      );
      transactionMessage = appendTransactionMessageInstruction(
        initializeStakeAccountInstruction,
        transactionMessage,
      );
      transactionMessage = appendTransactionMessageInstruction(
        delegateInstruction,
        transactionMessage,
      );

      const signedTransactionMessage =
        source === null
          ? await partiallySignTransactionMessageWithSigners(transactionMessage)
          : transactionMessage;

      return {
        result: {
          stakeTx: signedTransactionMessage,
          stakeAccount: stakeAccountPublicKey,
        },
      };
    } catch (error) {
      throw this.handleError('STAKE_ERROR', error);
    }
  }

  /**
   * Create account Tx, public key and array of keypair.
   *
   * @param address - The public key of the account.
   * @param lamports - The number of lamports to stake.
   * @param lockup - The stake account lockup
   *
   * @throws Throws an error if there's an issue creating an account.
   *
   * @returns Returns a promise that resolves with the Transaction, PublicKey and array of Keypair.
   *
   */
  private async createAccountTx(
    authorityPublicKey: Address,
    lamports: bigint,
    // lockup: Lockup,
  ): Promise<[IInstruction, IInstruction, Address]> {
    const stakeAccountKeyPair = await generateKeyPair();
    const signer = await createSignerFromKeyPair(stakeAccountKeyPair);

    const createAccountInstruction = getCreateAccountInstruction({
      payer: createNoopSigner(authorityPublicKey),
      newAccount: signer,
      lamports: lamports,
      // TODO get from package
      space: STAKE_ACCOUNT_V2_SIZE,
      programAddress: STAKE_PROGRAM_ADDRESS,
    });

    const initializeInstruction = repackInstruction(
      getInitializeInstruction(
        /** Uninitialized stake account */
        {
          stake: signer.address,
          arg0: {
            staker: authorityPublicKey,
            withdrawer: authorityPublicKey,
          },
          arg1: {
            //TODO use default
            unixTimestamp: 0,
            epoch: 0,
            custodian: ADDRESS_DEFAULT,
          },
        },
      ),
    );

    return [createAccountInstruction, initializeInstruction, signer.address];
  }

  /**
   * Create account Tx, public key and array of keypair using seed.
   *
   * @param authorityPublicKey - The public key of the account.
   * @param lamports - The number of lamports to stake.
   * @param source - The stake source
   * @param lockup - The stake account lockup
   *
   * @throws Throws an error if there's an issue creating an account.
   *
   * @returns Returns a promise that resolves with the Transaction, PublicKey and array of Keypair.
   *
   */
  private async createAccountWithSeedTx(
    authorityPublicKey: Address,
    lamports: bigint,
    source: string,
    // lockup: Lockup,
  ): Promise<[IInstruction, IInstruction, Address]> {
    // Format source to
    const seed = this.formatSource(source || '');

    const stakeAccountPubkey = await createAddressWithSeed({
      baseAddress: authorityPublicKey,
      programAddress: STAKE_PROGRAM_ADDRESS,
      seed: seed,
    });

    const createAccountInstruction = getCreateAccountWithSeedInstruction({
      payer: createNoopSigner(authorityPublicKey),
      newAccount: stakeAccountPubkey,
      baseAccount: createNoopSigner(authorityPublicKey),
      base: address(authorityPublicKey),
      seed: seed,
      amount: lamports,
      // TODO get from package
      space: STAKE_ACCOUNT_V2_SIZE,
      programAddress: STAKE_PROGRAM_ADDRESS,
    });

    const initializeInstruction = repackInstruction(
      getInitializeInstruction(
        /** Uninitialized stake account */
        {
          stake: stakeAccountPubkey,
          arg0: {
            staker: authorityPublicKey,
            withdrawer: authorityPublicKey,
          },
          arg1: {
            //TODO implement Lockup
            unixTimestamp: 0,
            epoch: 0,
            custodian: ADDRESS_DEFAULT,
          },
        },
      ),
    );

    return [
      createAccountInstruction,
      initializeInstruction,
      stakeAccountPubkey,
    ];
  }

  /** unstake - unstake
   * @param {string} sender - account blockchain address (staker)
   * @param {bigint} lamports - lamport amount
   * @param {string} source - stake source
   * @returns {Promise<object>} Promise object with Versioned Tx
   */
  public async unstake(
    sender: string,
    lamports: bigint,
    source: string,
    params?: Params,
  ): Promise<ApiResponse<UnstakeResponse>> {
    try {
      const stakeAccounts = (await this.getDelegations(sender)).result;

      const epoch =
        params?.epoch || (await this.connection.getEpochInfo().send()).epoch;
      const tm = this.timestampInSec();

      let totalActiveStake: bigint = 0n;
      const activeStakeAccounts = stakeAccounts.filter((acc) => {
        if (acc.data.state.__kind !== 'Stake') {
          return false;
        }

        const isActive = !(
          isLockupInForce(acc.data, epoch, BigInt(tm)) ||
          stakeAccountState(acc.data, epoch) !== StakeState.Active
        );

        if (isActive) {
          totalActiveStake =
            totalActiveStake + acc.data.state.fields[1].delegation.stake;
        }

        return isActive;
      });

      if (totalActiveStake < lamports)
        throw this.throwError('NOT_ENOUGH_ACTIVE_STAKE_ERROR');

      // ASC sorting
      activeStakeAccounts.sort((a, b): number => {
        const stakeA = isStake(a.data.state)
          ? a.data.state.fields[1].delegation.stake
          : 0n;
        const stakeB = isStake(b.data.state)
          ? b.data.state.fields[1].delegation.stake
          : 0n;

        return Number(stakeA - stakeB);
      });

      const accountsToDeactivate: Delegations = [];
      const accountsToSplit: [Account<StakeStateAccount, Address>, bigint][] =
        [];

      let i = 0;
      while (lamports > 0n && i < activeStakeAccounts.length) {
        const acc = activeStakeAccounts[i];
        if (acc === undefined || !isStake(acc.data.state)) {
          i++;
          continue;
        }

        const stakeAmount = acc.data.state.fields[1].delegation.stake;

        // If reminder amount less than min stake amount stake account automatically become disabled
        const isBelowThreshold =
          stakeAmount <= lamports || stakeAmount - lamports < MIN_AMOUNT;
        if (isBelowThreshold) {
          accountsToDeactivate.push(acc);
          lamports = lamports - stakeAmount;
          i++;
          continue;
        }

        accountsToSplit.push([acc, lamports]);
        break;
      }

      const senderPublicKey = address(sender);
      let transactionMessage = await this.baseTx(sender, params);

      // Get the minimum balance for rent exemption. Send request only if split required
      const minimumRent =
        accountsToSplit.length > 0
          ? await this.connection
              .getMinimumBalanceForRentExemption(
                //TODO get from account when it's would be available
                BigInt(STAKE_ACCOUNT_V2_SIZE),
              )
              .send()
          : 0n;

      for (const acc of accountsToSplit) {
        const [splitInstructions, newStakeAccountPubkey] = await this.split(
          senderPublicKey,
          acc[1],
          acc[0].address,
          source,
          // Need additional value for rent
          minimumRent,
        );

        splitInstructions.forEach(
          (splitInstruction) =>
            (transactionMessage = appendTransactionMessageInstruction(
              splitInstruction,
              transactionMessage,
            )),
        );

        const deactivateInstruction = repackInstruction(
          getDeactivateInstruction({
            stake: newStakeAccountPubkey,
            stakeAuthority: createNoopSigner(address(sender)),
          }),
        );
        transactionMessage = appendTransactionMessageInstruction(
          deactivateInstruction,
          transactionMessage,
        );
      }

      accountsToDeactivate.forEach((acc) => {
        const deactivateInstruction = repackInstruction(
          getDeactivateInstruction({
            stake: acc.address,
            stakeAuthority: createNoopSigner(address(sender)),
          }),
        );

        transactionMessage = appendTransactionMessageInstruction(
          deactivateInstruction,
          transactionMessage,
        );
      });

      if (transactionMessage.instructions.length === 0) {
        this.handleError('UNSTAKE_ERROR', 'zero instructions');
      }

      return { result: { unstakeTx: transactionMessage } };
    } catch (error) {
      throw this.handleError('UNSTAKE_ERROR', error);
    }
  }

  /**
   * Split existing account to create a new one
   *
   * @param authorityPublicKey - The public key of the account.
   * @param lamports - The number of lamports to stake.
   * @param oldStakeAccountPubkey -The public key of the old account.
   * @param source - The stake source
   *
   * @throws Throws an error if there's an issue splitting an account.
   *
   * @returns Returns a promise that resolves with the Transaction, PublicKey and array of Keypair.
   *
   */
  private async split(
    authorityPublicKey: Address,
    lamports: bigint,
    oldStakeAccountPubkey: Address,
    source: string,
    rentExemptReserve?: bigint,
  ): Promise<[Array<IInstruction>, Address]> {
    // Format source to
    const seed = this.formatSource(source);

    const newStakeAccountPubkey = await createAddressWithSeed({
      baseAddress: authorityPublicKey,
      programAddress: STAKE_PROGRAM_ADDRESS,
      seed,
    });

    const instructions: Array<IInstruction> = [];

    // TODO add support split w\o seed
    const allocateWithSeedInstruction = getAllocateWithSeedInstruction({
      newAccount: newStakeAccountPubkey,
      baseAccount: createNoopSigner(address(authorityPublicKey)),
      base: authorityPublicKey,
      seed: seed,
      //TODO get from library if possible
      space: STAKE_ACCOUNT_V2_SIZE,
      programAddress: STAKE_PROGRAM_ADDRESS,
    });

    instructions.push(allocateWithSeedInstruction);

    //If creates new account need to top up balance by rent amount
    if (rentExemptReserve && rentExemptReserve > 0) {
      const rentTransferInstruction = getTransferSolInstruction({
        source: createNoopSigner(authorityPublicKey),
        destination: newStakeAccountPubkey,
        amount: rentExemptReserve,
      });
      instructions.push(rentTransferInstruction);
    }

    const splitInstruction = repackInstruction(
      getSplitInstruction({
        stake: oldStakeAccountPubkey,
        splitStake: newStakeAccountPubkey,
        stakeAuthority: createNoopSigner(authorityPublicKey),
        args: lamports,
      }),
    );

    instructions.push(splitInstruction);

    return [instructions, newStakeAccountPubkey];
  }

  /**
   * Claim makes withdrawal from all sender's deactivated accounts.
   *
   * @param sender - The sender solana address.
   *
   * @throws Throws an error if there's an issue while claiming a stake.
   *
   * @returns Returns a promise that resolves with a Versioned Transaction.
   *
   */
  public async claim(
    sender: string,
    params?: Params,
  ): Promise<ApiResponse<ClaimResponse>> {
    try {
      const delegations = await this.getDelegations(sender);

      const epoch =
        params?.epoch || (await this.connection.getEpochInfo().send()).epoch;
      const tm = this.timestampInSec();

      let totalClaimableStake = 0n;
      const deactivatedStakeAccounts = delegations.result.filter((acc) => {
        const isDeactivated =
          !isLockupInForce(acc.data, epoch, BigInt(tm)) &&
          stakeAccountState(acc.data, epoch) === StakeState.Deactivated;
        if (isDeactivated) {
          totalClaimableStake += acc.lamports;
        }

        return isDeactivated;
      });

      if (deactivatedStakeAccounts.length === 0)
        throw this.throwError('NOTHING_TO_CLAIM_ERROR');

      let transactionMessage = await this.baseTx(sender, params);

      for (const acc of deactivatedStakeAccounts) {
        // Create the withdraw instruction
        const withdrawInstruction = repackInstruction(
          getWithdrawInstruction({
            stake: acc.address,
            recipient: address(sender),
            stakeHistory: STAKE_HISTORY_ACCOUNT,
            withdrawAuthority: createNoopSigner(address(sender)),
            args: acc.lamports,
          }),
        );

        transactionMessage = appendTransactionMessageInstruction(
          withdrawInstruction,
          transactionMessage,
        );
      }

      return {
        result: {
          claimTx: transactionMessage,
          totalClaimAmount: totalClaimableStake,
        },
      };
    } catch (error) {
      throw this.handleError('CLAIM_ERROR', error);
    }
  }

  /**
   * Merge two accounts into a new one
   *
   * @param authorityPublicKey - The public key of the account.
   * @param stakeAccount1 - The public key of the first account.
   * @param stakeAccount2 - The public key of the second account.
   *
   * @throws Throws an error if there's an issue while merging an account.
   *
   * @returns Returns a promise that resolves with the Transaction, PublicKey and array of Keypair.
   *
   */
  // private async merge(
  //   authorityPublicKey: PublicKey,
  //   stakeAccount1: PublicKey,
  //   stakeAccount2: PublicKey,
  // ) {
  //   const mergeStakeAccountTx = StakeProgram.merge({
  //     stakePubkey: stakeAccount1,
  //     sourceStakePubKey: stakeAccount2,
  //     authorizedPubkey: authorityPublicKey,
  //   });

  //   return [mergeStakeAccountTx];
  // }

  private async baseTx(
    sender: string,
    params?: Params,
  ): Promise<
    CompilableTransactionMessage & TransactionMessageWithBlockhashLifetime
  > {
    const finalLatestBlockhash =
      params?.finalLatestBlockhash ||
      (await this.connection.getLatestBlockhash().send()).value;

    let transactionMessage = pipe(
      createTransactionMessage({ version: 0 }),
      (tx) => setTransactionMessageFeePayer(address(sender), tx),
      (tx) =>
        setTransactionMessageLifetimeUsingBlockhash(finalLatestBlockhash, tx),
    );

    if (
      params?.computeUnitLimit !== undefined &&
      params?.computeUnitLimit > 0
    ) {
      const unitLimitInstruction = getSetComputeUnitLimitInstruction({
        /** Transaction compute unit limit used for prioritization fees. */
        units: params?.computeUnitLimit,
      });

      transactionMessage = prependTransactionMessageInstruction(
        unitLimitInstruction,
        transactionMessage,
      );
    }

    if (
      params?.сomputeUnitPrice !== undefined &&
      params?.сomputeUnitPrice > 0
    ) {
      const unitPriceInstruction = getSetComputeUnitPriceInstruction({
        /** Transaction compute unit price used for prioritization fees. */
        microLamports: params?.сomputeUnitPrice,
      });
      transactionMessage = prependTransactionMessageInstruction(
        unitPriceInstruction,
        transactionMessage,
      );
    }

    return transactionMessage;
  }

  /**
   * Generate a unique source for crating an account.
   *
   * @param source - source ID.
   *
   * @returns Returns a unique source for an account.
   *
   */
  private formatSource(source: string): string {
    const timestamp = new Date().getTime();
    source = `everstake ${source}:${timestamp}`;

    return source;
  }

  /**
   * Generate timestamp in seconds.
   *
   * @returns Returns a timestamp in seconds.
   *
   */
  private timestampInSec(): number {
    return (Date.now() / 1000) | 0;
  }
}

//TODO think about export of this methods
/**
 * Determins the current state of a stake account given the current epoch
 * @param currentEpoch
 * @returns `stakeAccount`'s stake state`string`
 */
export function stakeAccountState(
  account: StakeStateAccount,
  currentEpoch: bigint,
): string {
  //TODO check
  if (account.state.__kind !== 'Stake') {
    return StakeState.Inactive;
  }

  const activationEpoch = account.state.fields[1].delegation.activationEpoch;
  const deactivationEpoch =
    account.state.fields[1].delegation.deactivationEpoch;

  if (activationEpoch > currentEpoch) {
    return StakeState.Inactive;
  }
  if (activationEpoch === currentEpoch) {
    // if you activate then deactivate in the same epoch,
    // deactivationEpoch === activationEpoch.
    // if you deactivate then activate again in the same epoch,
    // the deactivationEpoch will be reset to EPOCH_MAX
    if (deactivationEpoch === activationEpoch) return StakeState.Inactive;

    return StakeState.Activating;
  }
  // activationEpoch < currentEpochBN
  if (deactivationEpoch > currentEpoch) return StakeState.Active;
  if (deactivationEpoch === currentEpoch) return StakeState.Deactivating;

  return StakeState.Deactivated;
}

/**
 * Check if lockup is in force
 * @param currEpoch current epoch.
 * @param currUnixTimestamp current unix timetamp.
 * @returns a bool type result.
 */
export function isLockupInForce(
  account: StakeStateAccount,
  currEpoch: bigint,
  currUnixTimestamp: bigint,
): boolean {
  if (
    account.state.__kind !== 'Stake' &&
    account.state.__kind !== 'Initialized'
  ) {
    return false;
  }

  const { unixTimestamp, epoch } = account.state.fields[0].lockup;

  return unixTimestamp > currUnixTimestamp || epoch > currEpoch;
}

export function isStake(
  state: StakeStateV2,
): state is Extract<StakeStateV2, { __kind: 'Stake' }> {
  return state.__kind === 'Stake';
}

//TEMP fix. Stake program expect u32 as intruction data size but Stake lib use u8
export function repackInstruction(
  initializeInstruction: IInstruction,
): IInstruction {
  if (
    initializeInstruction === undefined ||
    initializeInstruction.data === undefined
  ) {
    return initializeInstruction;
  }

  const desc = getU8Decoder().decode(initializeInstruction.data.subarray(0, 1));
  const descU32 = getU32Encoder().encode(desc);

  const result = new Uint8Array(3 + initializeInstruction.data.length);
  // Copy the value into the start of the new array
  result.set(descU32, 0);
  // Copy the original array after the prepended value
  result.set(initializeInstruction.data.subarray(1), 4);
  // initializeInstruction.data = result;
  const instruction = {
    accounts: initializeInstruction.accounts,
    programAddress: initializeInstruction.programAddress,
    data: result,
  } as IInstruction;

  return instruction;
}
