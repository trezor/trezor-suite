import bitcoin from 'bitcoinjs-lib';
import bip65 from 'bip65';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';

const network = bitcoin.networks.bitcoin;

const ECPair = ECPairFactory(ecc);

/**
 *
HASH160 <hash of the preimage> EQUAL
IF <public key of provider>
ELSE <timeout block height> CHECKLOCKTIMEVERIFY
DROP <public key of the user> ENDIF
CHECKSIG
 */

const swapContractGenerator = (
    swapProviderClaimPublicKey,
    userRefundPublicKey,
    PAYMENT_HASH,
    timelock,
) =>
    bitcoin.script.fromASM(
        `
        OP_HASH160
        ${bitcoin.crypto.ripemd160(Buffer.from(PAYMENT_HASH, 'hex')).toString('hex')}
        OP_EQUAL
        OP_IF
          ${swapProviderClaimPublicKey.toString('hex')}
        OP_ELSE
          ${bitcoin.script.number.encode(timelock).toString('hex')}
          OP_CHECKLOCKTIMEVERIFY
          OP_DROP
          ${userRefundPublicKey.toString('hex')}
        OP_ENDIF
        OP_CHECKSIG
      `
            .trim()
            .replace(/\s+/g, ' '),
    );

const keyPairUser = ECPair.makeRandom();
const keyPairSwapProvider = ECPair.makeRandom();

// Check the current block height and add 10 blocks to it.
// It means that the refund transaction will only
// be available 10 blocks after that the funding of the swap contract is confirmed.
// getblockchaininfo

const currentBlockHeight = 738120;

const TIMELOCK = 738120 + 10;
const PAYMENT_HASH = 'test';

const timelock = bip65.encode({ blocks: TIMELOCK });
console.log('Timelock expressed in block height:');
console.log(timelock);
const swapContract = swapContractGenerator(
    keyPairSwapProvider.publicKey,
    keyPairUser.publicKey,
    PAYMENT_HASH,
    timelock,
);
console.log('Swap contract (witness script):');
console.log(swapContract.toString('hex'));

const p2wsh = bitcoin.payments.p2wsh({ redeem: { output: swapContract, network }, network });
console.log('P2WSH swap smart contract address:');
console.log(p2wsh.address);
