import com.fasterxml.jackson.databind.JsonNode;
import com.satoshilabs.trezor.ward.relay.WarddClient;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HexFormat;

/**
 * The Java binding's part in `ward-wardd.sh`: open the wallet's store in the same wardd and print
 * its status, so the script can check a third binding sees the head the other two left.
 *
 * <pre>java -cp &lt;ward-relay classes and jars&gt; WarddSmoke.java URL TOKEN_FILE WARD_ID_HEX</pre>
 */
public class WarddSmoke {
    public static void main(String[] args) throws Exception {
        String token = Files.readString(Path.of(args[1])).trim();
        try (WarddClient wardd = WarddClient.connect(URI.create(args[0]), token)) {
            wardd.openStore(null, HexFormat.of().parseHex(args[2]), null);
            JsonNode status = wardd.status();
            System.out.println(status);
        }
    }
}
