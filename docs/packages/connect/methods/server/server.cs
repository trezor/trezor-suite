//Depends on nuget package NBitcoin (Install-Package NBitcoin)
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using NBitcoin;
using NBitcoin.Crypto;
using NBitcoin.DataEncoders;

class Server
{
	static void Main(string[] args)
	{
		string visual_challenge = "2015-03-23 17:39:22";
		byte[] random_challenge = Encoders.Hex.DecodeData("cd8552569d6e4509266ef137584d1e62c7579b5b8ed69bbafa4b864c6521e7c2");
		byte[] signature = Encoders.Hex.DecodeData("20f2d1a42d08c3a362be49275c3ffeeaa415fc040971985548b9f910812237bb41770bf2c8d488428799fbb7e52c11f1a3404011375e4080e077e0e42ab7a5ba02");

		var hiddenChallenge_Sha = Hashes.SHA256(random_challenge);
		var visualChallenge_Sha = Hashes.SHA256(Encoding.ASCII.GetBytes(visual_challenge));

		PubKey pubKey = new PubKey("023a472219ad3327b07c18273717bb3a40b39b743756bf287fbd5fa9d263237f45");
		bool verified = pubKey.VerifyMessage(hiddenChallenge_Sha.Concat(visualChallenge_Sha).ToArray(), Encoders.Base64.EncodeData(signature));
		Console.WriteLine(verified);
	}
}
