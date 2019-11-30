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
