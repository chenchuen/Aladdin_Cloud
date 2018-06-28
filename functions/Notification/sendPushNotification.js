const services = require('../services');
const Method = services.getConfig().Methods;

module.sendNotification = async function(admin, req, resp) {
  try {
    const message = setMessage(req.body.method, req.body.transactionUID, req.body.senderName);
    console.log(message);
    const fcmToken = await getRecipientFCMToken(admin, req.body.recipientUserType, req.body.recipientUID);
    console.log(fcmToken);
    var payload = {
        notification: {
            title: "Notification",
            body: JSON.stringify(message)
        },
    };
    admin.messaging().sendToDevice(fcmToken, payload)
        .then(function (response) {
            console.log("Successfully sent message:", response);
            return;
        })
        .catch(function (error) {
            console.log("Error sending message:", error);
            throw new Error('Failed sending notification!');
            return;
        });
    resp.send('Success');
  } catch(error) {
    console.log(error);
    resp.send('Failed');
  }
};

function setMessage(method, transactionUID, senderName) {
  switch (method) {
    case Method.CREATE_TRANSACTION:
      return {
        targetScreen: 'requests',
        transactionUID: transactionUID,
        message: 'You have a new request! Wanna check it out?'
      };
      break;
    case Method.UPDATE_TRANSACTION:
      return {
        targetScreen: 'requests',
        transactionUID: transactionUID,
        message: `${senderName} has updated your request!`
      };
      break;
    case Method.REVIEW:
      return {
        targetScreen: 'reviews',
        transactionUID: transactionUID,
        message: `${senderName} has left you a review!`
      };
      break;
    case Method.PAYMENT:
      return {
        targetScreen: 'revirequestsews',
        transactionUID: transactionUID,
        message: `${senderName} has paid for your services!`
      };
      break;
    default:
      throw new Error('Failed setting message');
  }
}

async function getRecipientFCMToken(admin, userType, recipientUID) {
  const FCMToken = await admin.database().ref(`Users/${userType}/${recipientUID}/fcmToken`)
    .once('value').then((response) => {
      return response.val();
    });
  return FCMToken;
}
