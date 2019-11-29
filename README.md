# dnsanchor - a Dynamic DNS anchor (WIP)

for NearlyFreeSpeech.net


## Status: Hello World

So far, all it does is:

```
$ make run
.../moddable/build/bin/lin/release/dnsanchor
Hello, world!
```

## xs: Tiny JavaScript Runtime

The [Moddable XS SDK][1] is designed to run JS in microcontrollers. We
use it to deploy javascript in a single small executable using object
capability (ocap) security techniques.

[1]: https://github.com/Moddable-OpenSource/moddable


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
