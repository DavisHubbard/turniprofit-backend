const functions = require("firebase-functions");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

const admin = require("firebase-admin");
admin.initializeApp();

// Take the text parameter passed to this HTTP endpoint and insert it into the
// Realtime Database under the path /messages/:pushId/original
exports.currentPrice = functions.https.onRequest(async (req, res) => {
  // Grab the text parameter.
  const price = req.body.text.trim();
  if (price.split(" ").length !== 1) {
    return res.status(200).send("Fix format please: /currentPrice [price]");
  } else if (price <= 0 || isNaN(price) || price === "" || price === null) {
    return res.status(200).send("Not a valid price, doofus!");
  } else {
    const userId = req.body.user_id;
    const tZoneOffset = -4.0 * 60 * 60 * 1000;
    const serverTime = new Date();
    const now = new Date(serverTime.getTime() + tZoneOffset);
    console.log(now);
    const today =
      now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
    let mornEve;
    if (now.getHours() < 12) {
      mornEve = "morning";
    } else {
      mornEve = "evening";
    }
    let endpoint = "/prices/" + today + "/" + mornEve + "/" + userId;
    // Push the new message into the Realtime Database using the Firebase Admin SDK.
    admin
      .database()
      .ref(endpoint)
      .set({ price: price });
    // Send a message back to the Slack channel
    // TODO: Output profit when purchase price endpoint is done
    if (parseInt(price) >= 500) {
      return res.status(200).json({
        response_type: "in_channel",
        text:
          "<!channel> HOLY CANOLI! <@" +
          userId +
          ">'s turnips are a whopping " +
          price +
          " Bells this " +
          mornEve +
          "!!!"
      });
    } else {
      return res.status(200).json({
        response_type: "in_channel",
        text:
          "<@" +
          userId +
          ">'s turnips are " +
          price +
          " Bells this " +
          mornEve +
          "!"
      });
    }
  }
});

exports.pastPrice = functions.https.onRequest(async (req, res) => {
  // Grab the text parameter.
  const userId = req.body.user_id;
  const params = req.body.text.split(" ");
  if (params.length !== 3) {
    return res.status(200).send("Format: /pastPrice [m/e] [day] [price]");
  }
  console.log(params);
  let mornEve = params[0];
  if (mornEve.toLowerCase() !== "m" && mornEve.toLowerCase() !== "e") {
    return res.status(200).send("First param does is not m or e. Try Again.");
  }
  if (mornEve === "m") {
    mornEve = "morning";
  } else {
    mornEve = "evening";
  }
  let date = params[1];
  let dateParts = date.split("-");
  if (
    dateParts.length !== 3 ||
    dateParts[0].length !== 4 ||
    parseInt(dateParts[1]) < 1 ||
    parseInt(dateParts[1]) > 12 ||
    parseInt(dateParts[2]) < 1 ||
    parseInt(dateParts[2]) > 31
  ) {
    return res.status(200).send("Invalid date format. Must be yyyy-m-d");
  }
  let price = params[2];
  if (parseInt(price) < 0 || parseInt(price) > 1000) {
    return res.status(200).send("Invalid price, doofus. Try again.");
  }
  let endpoint = "/prices/" + date + "/" + mornEve + "/" + userId;
  admin
    .database()
    .ref(endpoint)
    .set({ price: price });
  return res
    .status(200)
    .send(
      "Set your " + date + " " + mornEve + " price to " + price + " Bells!"
    );
});

//TODO: endpoint for adding price bought at
