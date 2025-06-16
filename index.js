// server.js ან app.js
const express = require('express');
const bodyParser = require('body-parser');
const TradeOfferManager = require('steam-tradeoffer-manager');
const SteamCommunity = require('steamcommunity');
const SteamUser = require('steam-user');
const session = require('express-session');

const app = express();
app.use(bodyParser.json());
app.use(session({ secret: 'your-secret', resave: false, saveUninitialized: true }));

app.post('/api/send-trade', async (req, res) => {
  const { steamId, partnerSteamID, itemsToGive, cookies } = req.body;
  console.log(cookies)

  if (!steamId || !partnerSteamID || !itemsToGive || !cookies) {
    return res.status(400).json({ success: false, message: 'Missing parameters' });
  }

  try {
    const community = new SteamCommunity();
    const manager = new TradeOfferManager({
      steam: new SteamUser(),
      community: community,
      language: 'en'
    });

    // Set cookies for community login
    community.setCookies(cookies);
    manager.setCookies(cookies, function(err) {
      if (err) {
        console.error('setCookies error:', err);
        return res.status(500).json({ success: false, message: 'Failed to set cookies' });
      }

      // Create the trade offer
      const offer = manager.createOffer( partnerSteamID );

      // Add items
      for (const item of itemsToGive) {
        offer.addMyItem({
          appid: 730,
          contextid: "2",
          assetid: item.assetid
        });
      }

      offer.setMessage("Trade from bot");

      offer.send(function(err, status) {
        if (err) {
          console.error('Trade send error:', err);
          return res.status(500).json({ success: false, message: 'Failed to send offer' });
        }

        console.log(`✅ Offer sent. Status: ${status}`);
        return res.json({ success: true, status });
      });
    });

  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Trade bot API running on port ${PORT}`);
});
