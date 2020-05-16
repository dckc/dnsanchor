export MODDABLE := $(HOME)/projects/moddable
export PATH := $(MODDABLE)/build/bin/lin/release:$(PATH)

PKG=dnsanchor

.PHONY: build run

build: ./build/bin/lin/release/$(PKG)

./build/bin/lin/release/$(PKG): bootstrap.js lib/*.js manifest.json \
		$(MODDABLE)/xs/platforms/lin_xs_cli.c \
		$(MODDABLE)/modules/network/socket/lin/modSocket.c
	mkdir -p ./build
	mcconfig -o ./build -p x-cli-lin -m

debug_sim: bootstrap.js lib/*.js manifest.json $(MODDABLE)/xs/platforms/lin_xs_cli.c
	mkdir -p ./build
	mcconfig -o ./build -d -m

debug: bootstrap.js lib/*.js manifest.json $(MODDABLE)/xs/platforms/lin_xs_cli.c
	mkdir -p ./build
	mcconfig -o ./build -p x-cli-lin -d -m

run: build
	./build/bin/lin/release/$(PKG)

check:
	jq . manifest.json

clean:
	rm -rf ./build

