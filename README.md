# Neotokyo-playercount-logger

Just a small NodeJS program that gets the number of people playing [Neotokyo°](http://store.steampowered.com/app/244630/) and optionally submits that to a [Phant](http://phant.io/) server.

# getting started

1. Install NodeJS
2. `npm install`
3. Setup config.json (see below)
4. `node index.js`

# config.json format

    {
        "phant-post": {
            "post-url": PHANT ENDPOINT URL TO POST TO,
            "private-key": PHANT PRIVATE KEY
        }
    }

# TODOs

1. Check phant return code properly
2. Implement a fetch loop so that you don't have to run your own scheduler which runs the script whenever appropriate. This loop should make proper use of the phant return code.
3. Refactor some code?

# LICENSE

MIT. See LICENSE file.
