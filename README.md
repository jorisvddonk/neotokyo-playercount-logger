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

1. Count number of alcoholic beverages consumed by players (via the Standard Neotokyo° Consumed Alcoholic Beverages nickname convention)
2. Check phant return code properly
3. Quit on done() (so the script can be crontabbed) or implement a fetch loop.

# LICENSE

MIT. See LICENSE file.
