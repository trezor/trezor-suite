<?php

// Dependencies: https://github.com/BitcoinPHP/BitcoinECDSA.php

require_once("BitcoinECDSA.php");

use BitcoinPHP\BitcoinECDSA\BitcoinECDSA;

function sha256($data)
{
    return hash('sha256', $data, TRUE);
}

function verify($challenge_hidden, $challenge_visual, $pubkey, $signature, $version)
{
    if ($version == 1) {
        $message = hex2bin($challenge_hidden) . $challenge_visual;
    } elseif ($version == 2) {
        $message = sha256(hex2bin($challenge_hidden)) . sha256($challenge_visual);
    } else {
        die('Unknown version');
    }

    $R = substr($signature, 2, 64);
    $S = substr($signature, 66, 64);

    $ecdsa = new BitcoinECDSA();
    $hash = $ecdsa->hash256("\x18Bitcoin Signed Message:\n" . $ecdsa->numToVarIntString(strlen($message)) . $message);

    return (bool)$ecdsa->checkSignaturePoints($pubkey, $R, $S, $hash);

}

$challenge_hidden = "cd8552569d6e4509266ef137584d1e62c7579b5b8ed69bbafa4b864c6521e7c2"; // Use random value
$challenge_visual = "2015-03-23 17:39:22";
$pubkey = "023a472219ad3327b07c18273717bb3a40b39b743756bf287fbd5fa9d263237f45";
$signature = "20f2d1a42d08c3a362be49275c3ffeeaa415fc040971985548b9f910812237bb41770bf2c8d488428799fbb7e52c11f1a3404011375e4080e077e0e42ab7a5ba02";

echo (int)verify($challenge_hidden, $challenge_visual, $pubkey, $signature, 2);
