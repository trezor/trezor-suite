# Dependencies: https://github.com/lian/bitcoin-ruby

require 'digest'
require 'bitcoin'

challenge_hidden = "cd8552569d6e4509266ef137584d1e62c7579b5b8ed69bbafa4b864c6521e7c2" # Use random value
challenge_visual = "2015-03-23 17:39:22"
public_key = "023a472219ad3327b07c18273717bb3a40b39b743756bf287fbd5fa9d263237f45"
signature = "20f2d1a42d08c3a362be49275c3ffeeaa415fc040971985548b9f910812237bb41770bf2c8d488428799fbb7e52c11f1a3404011375e4080e077e0e42ab7a5ba02"

def verify(challenge_hidden, challenge_visual, pubkey, signature, version)
  address = Bitcoin.pubkey_to_address(pubkey)
  sha256 = Digest::SHA256.new
  signature = [signature.htb].pack('m0')
  case version
    when 1
      message = challenge_hidden.htb + challenge_visual
    when 2
      message = sha256.digest(challenge_hidden.htb) + sha256.digest(challenge_visual)
    else
      raise "Unknown version"
  end
  Bitcoin.verify_message(address, signature, message, 2)
end
