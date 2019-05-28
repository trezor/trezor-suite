declare module 'ethereum-types' {
    // start data types
    declare export type EthereumUnitT =
      | 'kwei'
      | 'ada'
      | 'mwei'
      | 'babbage'
      | 'gwei'
      | 'shannon'
      | 'szabo'
      | 'finney'
      | 'ether'
      | 'kether'
      | 'grand'
      | 'einstein'
      | 'mether'
      | 'gether'
      | 'tether'

    declare export type EthereumAddressT = string
    declare export type EthereumBlockNumberT = number
    declare export type EthereumBlockHashT = string
    declare export type EthereumTransactionHashT = string
    // end data types

    // start contract types
    declare export type EthereumWatchErrorT = ?Object

    declare export type EthereumEventT<A> = {
      address: EthereumAddressT,
      args: A,
      blockHash: EthereumBlockHashT,
      blockNumber: number,
      event: string,
      logIndex: number,
      transactionHash: EthereumTransactionHashT,
      transactionIndex: number,
      transactionLogIndex: string,
      type: 'mined' // TODO: what other types are there?
    }

    // this represents the setup object returned from truffle-contract
    // we use it to get a known contact `at(address)` (ie. for POATokenContract addresses)
    declare export type EthereumContractSetupT<A> = {
      at: EthereumAddressT => Promise<A>
    }

    declare export type EthereumSendTransactionOptionsT = {
      from: EthereumAddressT,
      gas: number,
      value?: number
    }

    declare export type EthereumSendTransactionT = EthereumSendTransactionOptionsT => Promise<EthereumTransactionHashT>

    // TODO(mattgstevens): it would be nice to have an Generic type for a Contract instance
    // similar to the EthererumWatchEventT
    //
    // declare export type SendTransactionContractT = interface .sendTransaction(EthereumAddressT)
    // declare export type WatchableContractT = <A>(error: Object, response: A)

    // declare export type EthereumContractWatcherT = (options: {
    //   fromBlock?: EthereumBlockNumberT,
    //   toBlock?: EthereumBlockNumberT,
    //   address?: EthereumAddressT
    // }) => *

    // end contract data
}
