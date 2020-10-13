# dnsanchor - a Dynamic DNS anchor

**dnsanchor** is a dynamic DNS client for
[NearlyFreeSpeech.net][NFSN] much like [nfsn-pingbot][], built
with JavaScript using object capability ([ocap][])
security techniques.

_It's *intended* to run on the [xs][] platform, but [I can't get
sockets to work][298]._

[nfsn-pingbot]: https://github.com/joshkunz/nfsn-pingbot
[NFSN]: https://www.nearlyfreespeech.net/
[ocap]: https://en.wikipedia.org/wiki/Object-capability_model
[298]: https://github.com/Moddable-OpenSource/moddable/issues/298


## Configuration and node.js Usage

Get an API key for the [NSFN API][3] and make a `config.json` file a
la:

```json
{
  "login": "mememe",
  "API_KEY": "super-sekret",
  "domain": "my.nfsn.domain.example",
  "host": "dyndnshost1"
}
```

Then `npm install` as usual and `npm start` to run it:

```
$ npm start

> dnsanchor@0.1.0 start /home/connolly/projects/dnsanchor
> node -r esm index.js

{ action: 'add', name: 'dyndnshost1', type: 'A', data: '1.2.3.4' }
{ action: 'remove', addrs: [] }
```

Run it again and it will detect that no changes are needed:

```
npm start
{ action: 'noop', name: 'dyndnshost1', ip: '1.2.3.4',
  target: [{
      name: 'dyndnshost1', type: 'A', data: '1.2.3.4',
      ttl: 3600, scope: 'member'
    }]}
```

[3]: https://members.nearlyfreespeech.net/wiki/API/Introduction


## xs: Tiny, Modern JavaScript Runtime (WIP)

The [Moddable XS SDK][xs] is designed to run JS in microcontrollers. It
has good support for JavaScript best practices including object
capability discipline and it supports deployment as a single small
executable.

[xs]: https://github.com/Moddable-OpenSource/moddable


### Build from source

The `x-cli-lin` platform is a custom [ag-linux-cli][2] branch. Only
linux is supported (patches welcome!).

[2]: https://github.com/dckc/moddable/tree/ag-linux-cli


```
$ make
mcconfig -p x-cli-lin
cd .../moddable/build/tmp/lin/release/dnsanchor && make
make[1]: Entering directory '.../moddable/build/tmp/lin/release/dnsanchor'
# xsc instrumentation.xsb
# xsc console.xsb
# xsc dnsanchor.xsb
...
# cc dnsanchor
make[1]: Leaving directory '.../moddable/build/tmp/lin/release/dnsanchor'
```

## Integration Test Passed on XS

```
bootstrap main()...
@@go...
@@got compartment...
@@got exports...
run()...
Hello, world!
API key length: 16
web.https: api.ipify.org 443
@@httpsPath https://api.ipify.org:443/ {}
@@readFile makeRequest {"host":"api.ipify.org","port":443,"method":"GET","path":"/","headers":{},"body":false}
IP address: 169.147.3.26
web.https: api.nearlyfreespeech.net 443
@@httpsPath https://api.nearlyfreespeech.net:443/ {}
@@httpsPath https://api.nearlyfreespeech.net:443/dns/madmode.com/listRRs {}
@@httpsPath https://api.nearlyfreespeech.net:443/dns/madmode.com/listRRs {"X-NFSN-Authentication":"connolly;1602611772;5d41ff08485f3a7c;41e1b412d8f22ee4d0ff39e294b2ede969148196","Content-Type":"application/x-www-form-urlencoded"}
@@readFile makeRequest {"host":"api.nearlyfreespeech.net","port":443,"method":"POST","path":"/dns/madmode.com/listRRs","headers":{"X-NFSN-Authentication":"connolly;1602611772;5d41ff08485f3a7c;41e1b412d8f22ee4d0ff39e294b2ede969148196","Content-Type":"application/x-www-form-urlencoded","content-length":"20"},"body":"name=capnhook&type=A"}
@@sendRequest cb 1 200 undefined
@@sendRequest cb 5 [{"name":"capnhook","type":"A","data":"136.33.249.0","ttl":3600,"scope":"member"}] undefined
{"action":"add","name":"capnhook","type":"A","data":"169.147.3.26"}
{"action":"remove","addrs":[{"name":"capnhook","type":"A","data":"136.33.249.0","ttl":3600,"scope":"member"}]}
web.https: api.nearlyfreespeech.net 443
@@httpsPath https://api.nearlyfreespeech.net:443/ {}
@@httpsPath https://api.nearlyfreespeech.net:443/dns/madmode.com/addRR {}
@@httpsPath https://api.nearlyfreespeech.net:443/dns/madmode.com/addRR {"X-NFSN-Authentication":"connolly;1602611773;244010a8649db010;c7351ca9b200df2f7c6190a16df45cdab0ffea7c","Content-Type":"application/x-www-form-urlencoded"}
@@readFile makeRequest {"host":"api.nearlyfreespeech.net","port":443,"method":"POST","path":"/dns/madmode.com/addRR","headers":{"X-NFSN-Authentication":"connolly;1602611773;244010a8649db010;c7351ca9b200df2f7c6190a16df45cdab0ffea7c","Content-Type":"application/x-www-form-urlencoded","content-length":"38"},"body":"name=capnhook&type=A&data=169.147.3.26"}

web.https: api.nearlyfreespeech.net 443
@@httpsPath https://api.nearlyfreespeech.net:443/ {}
@@httpsPath https://api.nearlyfreespeech.net:443/dns/madmode.com/removeRR {}
@@httpsPath https://api.nearlyfreespeech.net:443/dns/madmode.com/removeRR {"X-NFSN-Authentication":"connolly;1602611773;042c46363e2dd3d0;310a2098b2f158752b1b6dd80a9f8515ecb9bc2f","Content-Type":"application/x-www-form-urlencoded"}
@@readFile makeRequest {"host":"api.nearlyfreespeech.net","port":443,"method":"POST","path":"/dns/madmode.com/removeRR","headers":{"X-NFSN-Authentication":"connolly;1602611773;042c46363e2dd3d0;310a2098b2f158752b1b6dd80a9f8515ecb9bc2f","Content-Type":"application/x-www-form-urlencoded","content-length":"38"},"body":"name=capnhook&type=A&data=136.33.249.0"}
@@sendRequest cb 1 200 undefined
@@sendRequest cb 5  undefined
@@ran
```
