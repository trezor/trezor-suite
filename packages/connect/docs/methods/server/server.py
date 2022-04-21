# Dependencies: https://pypi.python.org/pypi/bitcoin >= 1.1.27

import binascii
import hashlib
import base64
import bitcoin

def verify(challenge_hidden, challenge_visual, pubkey, signature, version):
    if version == 1:
        message = binascii.unhexlify(challenge_hidden + binascii.hexlify(challenge_visual))
    elif version == 2:
        h1 = hashlib.sha256(binascii.unhexlify(challenge_hidden)).digest()
        h2 = hashlib.sha256(challenge_visual).digest()
        message = h1 + h2
    else:
        raise Exception('Unknown version')
    signature_b64 = base64.b64encode(binascii.unhexlify(signature))
    return bitcoin.ecdsa_verify(message, signature_b64, pubkey)

def main():
    challenge_hidden = "cd8552569d6e4509266ef137584d1e62c7579b5b8ed69bbafa4b864c6521e7c2" # Use random value
    challenge_visual = "2015-03-23 17:39:22"
    pubkey = "023a472219ad3327b07c18273717bb3a40b39b743756bf287fbd5fa9d263237f45"
    signature = "20f2d1a42d08c3a362be49275c3ffeeaa415fc040971985548b9f910812237bb41770bf2c8d488428799fbb7e52c11f1a3404011375e4080e077e0e42ab7a5ba02"
    print verify(challenge_hidden, challenge_visual, pubkey, signature, 2)

if __name__ == '__main__':
    main()
