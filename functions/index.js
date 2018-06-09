const functions = require('firebase-functions');
const admin = require('firebase-admin');
const serviceAccount = require('./aladdinapp-942fe-firebase-adminsdk-j60zx-0a9586c82e.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://aladdinapp-942fe.firebaseio.com'
});
const sha256 = require('sha256');
const services = require('./services');
const Method = services.getConfig().Methods;

exports.getFullParameters = functions.https.onRequest((req, resp) => {
  const config = services.getConfig();
  //TODO: verify the request whether got missing parameters
  //TODO: verify sender identity make sure not fake request from third party
  let paymentInfo = req.body.paymentInfoWithID;
  paymentInfo.ServiceID = config.ServiceID;
  paymentInfo.MerchantReturnURL = config.MerchantReturnURL;
  const toHash = config.MerchantPassword + config.ServiceID + paymentInfo.PaymentID
        + config.MerchantReturnURL + paymentInfo.Amount + paymentInfo.CurrencyCode
        + paymentInfo.CustIP;
  const HashValue = sha256(toHash);
  paymentInfo.HashValue = HashValue;
  resp.send(paymentInfo);
});

exports.confirmPayment = functions.https.onRequest((req, resp) => {
  const config = services.getConfig();
  const dateNow = admin.database.ServerValue.TIMESTAMP;
  var paymentInfo = req.body;

  if(!services.validateRequest(paymentInfo, config.MerchantPassword)){
    throw new Error("Invalid Hash");
  }
//update payment branch
//update transaction branch
  var refToPayment = admin.database().ref('Payments/' + paymentInfo.PaymentID);
  var refToTransaction = admin.database().ref('Transactions/' + paymentInfo.OrderNumber);
  switch (paymentInfo.TxnStatus) {
    case '0': //success
      refToPayment.update({
        paid:paymentInfo.Amount,
        updatedDate:dateNow,
        status:'Confirmed',
        trxCode:paymentInfo.TxnStatus,
        AuthCode:paymentInfo.AuthCode,
        BankRefNo:paymentInfo.BankRefNo,
        TxnID:paymentInfo.TxnID
      });
      refToTransaction.update({
        status:'Confirmed',
        PaymentID:paymentInfo.PaymentID,
        trxCode:paymentInfo.TxnStatus,
      });
      const CustomerSuccessPayload = setMessage('PAYMENT_SUCCESS', req.body.Param6, 'customer');
      const VendorSuccessPayload = setMessage('PAYMENT_SUCCESS', req.body.Param7, 'vendor');

      sendNotification(admin, 'customer', req.body.Param6, CustomerSuccessPayload);
      sendNotification(admin, 'vendor', req.body.Param7, VendorSuccessPayload);
      break;
    case '1': //failed
      refToPayment.update({
        updatedDate:dateNow,
        status:'Payment Failed',
        trxCode:paymentInfo.TxnStatus,
        AuthCode:paymentInfo.AuthCode,
        BankRefNo:paymentInfo.BankRefNo,
        TxnID:paymentInfo.TxnID
      });
      refToTransaction.update({
        status:'Payment Failed',
        PaymentID:paymentInfo.PaymentID,
        trxCode:paymentInfo.TxnStatus,
      });

      const CustomerFailedPayload = setMessage('PAYMENT_FAILED', req.body.Param6, 'customer');
      sendNotification(admin, 'customer', req.body.Param6, CustomerFailedPayload);
      break;
    case '2': //processing
      refToPayment.update({
        updatedDate:dateNow,
        status:'Payment Processing',
        trxCode:paymentInfo.TxnStatus,
        AuthCode:paymentInfo.AuthCode,
        BankRefNo:paymentInfo.BankRefNo,
        TxnID:paymentInfo.TxnID
      });
      refToTransaction.update({
        status:'Payment Processing',
        PaymentID:paymentInfo.PaymentID,
        trxCode:paymentInfo.TxnStatus,
      });
      break;
  }
  resp.send('Success');
});

exports.sendPushNotification = functions.https.onRequest((req, resp) => {
  try {
    console.log(req.body);
    const payload = setMessage(req.body.method, req.body.transactionUID, req.body.recipientUserType);
    console.log(payload);

    sendNotification(admin, req.body.recipientUserType, req.body.recipientUID, payload);

    resp.send('Success');
  } catch(error) {
    console.log(error);
    resp.send('Failed');
  }
});

function setMessage(method, transactionUID, userType) {
  switch (method) {
    case Method.CREATE_TRANSACTION:
      return {
        notification: {
            title: 'You have a new service request!',
            body: 'Tap to find out more',
            targetScreen: 'requests',
            transactionUID: transactionUID
        },
      };
      break;
    case Method.UPDATE_TRANSACTION:
      return {
        notification: {
            title: 'Your service request has been updated!',
            body: 'Tap to find out more',
            targetScreen: 'requests',
            transactionUID: transactionUID
        },
      };
      break;
    case Method.REVIEW:
      return {
        notification: {
            title: 'Someone has left you a review!',
            body: 'Tap to find out more',
            targetScreen: 'reviews',
            transactionUID: transactionUID
        },
      };
      break;
    case Method.PAYMENT_SUCCESS:
    console.log(method, transactionUID, userType);
      if (userType === 'customer') {
        return {
          notification: {
              title: 'Payment successfull!',
              body: 'Tap to find out more',
              pop: 'true',
              targetScreen: 'requests',
              transactionUID: transactionUID
          },
        };
      } else if (userType === 'vendor') {
        return {
          notification: {
              title: 'You have received a payment!',
              body: 'Tap to find out more',
              targetScreen: 'requests',
              transactionUID: transactionUID
          },
        };
      } else {
        throw new Error('Invalid user type!');
      }
      break;
      case Method.PAYMENT_FAILED:
        return {
          notification: {
              title: 'Your payment has failed',
              body: 'Tap to find out more',
              targetScreen: 'requests',
              transactionUID: transactionUID
          },
        };
        break;
    default:
      throw new Error('Failed setting message');
  }
}

function getRecipientFCMToken(admin, userType, recipientUID) {
  try {
    return new Promise(function(resolve, reject) {
      admin.database().ref(`Users/${userType}/${recipientUID}/fcmToken`)
        .once('value').then((response) => {
          resolve(response.val())
        });
    });
  } catch (error) {
    throw error
  }
  //
  // const FCMToken = await admin.database().ref(`Users/${userType}/${recipientUID}/fcmToken`)
  //   .once('value').finally((response) => {
  //     return response.val();
  //   });
  //return FCMToken;
}

function sendNotification(admin, userType, recipientUID, payload) {
  try {
    getRecipientFCMToken(admin, userType, recipientUID)
    .then(function(fcmToken) {
      console.log(fcmToken);
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
    });
  } catch (error) {
    throw error
  }

}
