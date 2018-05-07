const functions = require('firebase-functions');
const admin = require('firebase-admin');
const serviceAccount = require('./aladdinapp-942fe-firebase-adminsdk-j60zx-0a9586c82e.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://aladdinapp-942fe.firebaseio.com'
});
const sha256 = require('sha256');
const services = require('./services');

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

  console.log(paymentInfo);

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

    console.log(req.body);
    var message = {
        notification: { 
            title: "Notification",
            body: JSON.stringify(req.body)
        },
    };
    admin.messaging().sendToDevice(req.body.FCMtoken, message)
        .then(function (response) {
            console.log("Successfully sent message:", response);
            return;
        })
        .catch(function (error) {
            console.log("Error sending message:", error);
            return;
        });
    resp.send('Success');
});
