# dnsanchor - a Dynamic DNS anchor (WIP)

**dnsanchor** is _(intended to be)_ a dynamic DNS client for
[NearlyFreeSpeech.net][NFSN] much like [nfsn-pingbot][] but built on
the [xs][] JavaScript platform using object capability ([ocap][])
security techniques.

[nfsn-pingbot]: https://github.com/joshkunz/nfsn-pingbot
[NFSN]: https://www.nearlyfreespeech.net/
[ocap]: https://en.wikipedia.org/wiki/Object-capability_model


## Configuration and Usage (WIP)

Get an API key for the [NSFN API][3] and make a `config.json` file a
la:

```json
{
  "API_KEY": "super-sekret"
}
```

Then build (see below) and run the executable. _So far, all it does is
report the length of the API key:_

```
$ make run
.../moddable/build/bin/lin/release/dnsanchor
API key length: 12
```
[3]: https://members.nearlyfreespeech.net/wiki/API/Introduction


## xs: Tiny, Modern JavaScript Runtime

The [Moddable XS SDK][xs] is designed to run JS in microcontrollers. It
has good support for JavaScript best practices including object
capability discipline and it supports deployment as a single small
executable.

[xs]: https://github.com/Moddable-OpenSource/moddable


## Build from source

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
