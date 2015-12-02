export class NativeAddressSource {

    constructor(node) {
        // TODO: address version
        this.node = node;
    }

    derive(firstIndex, lastIndex) {
        let as = [];
        for (let i = firstIndex; i <= lastIndex; i++) {
            as.push(this.node.derive(i).getAddress());
        }
        return Promise.resolve(as);
    }
}

export class WorkerAddressSource {

    constructor(channel, node, version) {
        this.channel = channel;
        this.node = {
            depth: node.depth,
            child_num: node.index,
            fingerprint: node.parentFingerprint,
            chain_code: node.chainCode,
            public_key: node.keyPair.getPublicKeyBuffer()
        };
        this.version = version;
    }

    derive(firstIndex, lastIndex) {
        let request = {
            type: 'deriveAddressRange',
            node: this.node,
            version: this.version,
            firstIndex,
            lastIndex
        };
        return this.channel.postMessage(request)
            .then(({addresses}) => addresses);
    }
}

export class PrefatchingSource {

    constructor(source) {
        this.source = source;
        this.prefatched = null;
    }

    derive(firstIndex, lastIndex) {
        let promise;

        if (this.prefatched
            && this.prefatched.firstIndex === firstIndex
            && this.prefatched.lastIndex === lastIndex) {

            promise = this.prefatched.promise;
        } else {
            promise = this.source.derive(firstIndex, lastIndex);
        }
        this.prefatched = null;

        return promise.then((result) => {
            let nf = lastIndex + 1;
            let nl = lastIndex + 1 + (lastIndex - firstIndex);
            let next = this.source.derive(nf, nl);

            this.prefatched = {
                firstIndex: nf,
                lastIndex: nl,
                promise: next
            };

            return result;
        });
    }
}

export class CachingSource {

    constructor(source) {
        this.source = source;
        this.cache = Object.create(null);
    }

    store() {
        return {
            cache: this.cache
        };
    }

    restore(data) {
        this.cache = data.cache;
    }

    derive(firstIndex, lastIndex) {
        let key = `${firstIndex}-${lastIndex}`;

        if (this.cache[key] !== undefined) {
            return Promise.resolve(this.cache[key]);

        } else {
            return this.source.derive(firstIndex, lastIndex)
                .then((result) => this.cache[key] = result);
        }
    }
}
