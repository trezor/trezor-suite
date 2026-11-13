import { BLOCKCHAIN, type BlockchainEvent, createBlockchainMessage } from './events';

declare const blockchainError: Extract<
    BlockchainEvent,
    { type: typeof BLOCKCHAIN.ERROR }
>['payload'];
const blockchainMessage = createBlockchainMessage(BLOCKCHAIN.ERROR, blockchainError);
void (blockchainMessage.type satisfies typeof BLOCKCHAIN.ERROR);
void (blockchainMessage.payload satisfies typeof blockchainError);

declare const blockchainNotification: Extract<
    BlockchainEvent,
    { type: typeof BLOCKCHAIN.NOTIFICATION }
>['payload'];
const blockchainMessage2 = createBlockchainMessage(BLOCKCHAIN.NOTIFICATION, blockchainNotification);
void (blockchainMessage2.type satisfies typeof BLOCKCHAIN.NOTIFICATION);
void (blockchainMessage2.payload satisfies typeof blockchainNotification);

// @ts-expect-error Payload is required for blockchain error messages.
createBlockchainMessage(BLOCKCHAIN.ERROR);
