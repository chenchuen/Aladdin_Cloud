const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const sha256 = require('sha256');
const services = require('./services');

exports.getFullParameters = functions.https.onRequest((req, resp) => {
  const config = services.getConfig();
  //TODO:verify the request whether got missing parameters
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
        status:'Paid',
        trxCode:paymentInfo.TxnStatus,
        AuthCode:paymentInfo.AuthCode,
        BankRefNo:paymentInfo.BankRefNo,
        TxnID:paymentInfo.TxnID
      });
      refToTransaction.update({
        status:'Paid',
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
