export MODDABLE := $(HOME)/projects/moddable
export PATH := $(MODDABLE)/build/bin/lin/release:$(PATH)

PKG=dnsanchor

.PHONY: build run

build: $(MODDABLE)/build/bin/lin/release/$(PKG)

$(MODDABLE)/build/bin/lin/release/$(PKG): bootstrap.js lib/*.js
	mcconfig -p x-cli-lin
	cd $(MODDABLE)/build/tmp/lin/release/$(PKG) && $(MAKE)

run: build
	$(MODDABLE)/build/bin/lin/release/$(PKG)

check:
	jq . manifest.json

clean:
	rm -rf $(MODDABLE)/build/tmp/lin/release/$(PKG)
	rm -rf $(MODDABLE)/build/bin/lin/release/$(PKG)

