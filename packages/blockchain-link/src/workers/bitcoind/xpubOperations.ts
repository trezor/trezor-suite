import * as Bjs from 'bitcoinjs-lib';
import B58 from 'bs58check';

export default class XpubOperations {
    // mainnet
    pubTypes = [
        '04b24746', // zpub
        '02aa7ed3', // Zpub
        '049d7cb2', // ypub
        '0295b43f', // Ypub
        '044a5262', // upub
        '024289ef', // Upub
    ];
    // testnet
    pubTypesTestnet = [
        '045f1cf6', // vpub
        '02575483', // Vpub
    ];
    xpubTpubTypes = ['0488b21e', '043587cf'];
    allPubTypes = [...this.pubTypes, ...this.pubTypesTestnet, ...this.xpubTpubTypes];
    buffer;
    network;
    vPubOrZPub;
    xpub;

    isExtendedPublicKey(variousPub: string): boolean {
        const payload = B58.decode(variousPub);
        const version = payload.slice(0, 4);

        if (!this.allPubTypes.includes(version.toString('hex'))) {
            return false;
        }
        return true;
    }

    isXpub(xpub: string): boolean {
        const payload = B58.decode(xpub);
        const version = payload.slice(0, 4);

        if (!this.xpubTpubTypes.includes(version.toString('hex'))) {
            return false;
        }
        return true;
    }
    // convert zpub/vpub to xpub
    toXpub(vPubOrZPub) {
        const payload = B58.decode(vPubOrZPub);
        const version = payload.slice(0, 4);
        const key = payload.slice(4);
        let buffer;

        if (
            !this.pubTypes.includes(version.toString('hex')) &&
            !this.pubTypesTestnet.includes(version.toString('hex'))
        ) {
            throw new Error('prefix is not supported');
        }

        if (this.pubTypes.includes(version.toString('hex'))) {
            buffer = Buffer.concat([Buffer.from('0488b21e', 'hex'), key]); // xpub
            this.network = Bjs.networks.bitcoin;
        }

        if (this.pubTypesTestnet.includes(version.toString('hex'))) {
            buffer = Buffer.concat([Buffer.from('043587cf', 'hex'), key]); // tpub
            this.network = Bjs.networks.testnet;
        }

        return B58.encode(buffer);
    }

    getAddressSegwitFromvPubOrZPub(index, vpub): string {
        this.xpub = this.toXpub(vpub);

        const payment = Bjs.payments.p2wpkh({
            pubkey: Bjs.bip32
                .fromBase58(this.xpub, this.network)
                .derive(0)
                .derive(index).publicKey,
            network: this.network,
        });

        if (payment.address) {
            return payment.address as string;
        }
        throw new Error('Error with generation segwit address');
    }

    getAddressSegwit(index, xpub): string {
        const payment = Bjs.payments.p2wpkh({
            pubkey: Bjs.bip32
                .fromBase58(xpub)
                .derive(0)
                .derive(index).publicKey,
            network: this.network,
        });
        if (payment.address) {
            return payment.address as string;
        }
        throw new Error('Error with generation segwit address');
    }

    getAddressLegacy(index, xpub): string {
        const payment = Bjs.payments.p2pkh({
            pubkey: Bjs.bip32
                .fromBase58(xpub)
                .derive(0)
                .derive(index).publicKey,
            network: this.network,
        });

        if (payment.address) {
            return payment.address as string;
        }
        throw new Error('Error with generation legacy address');
    }
}
