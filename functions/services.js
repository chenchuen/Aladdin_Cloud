const sha256 = require('sha256');

exports.getConfig = function() {
  return {
    eGHLurl: 'https://test2pay.ghl.com/IPGSG/Payment.aspx',
    ServiceID: 'sit',
    MerchantPassword: 'sit12345',
    MerchantName: 'E-Reno',
    MerchantReturnURL: 'https://us-central1-aladdinapp-942fe.cloudfunctions.net/confirmPayment',
    MerchantApprovalURL: 'https://us-central1-aladdinapp-942fe.cloudfunctions.net/confirmPayment',
    MerchantCallBackURL: 'https://us-central1-aladdinapp-942fe.cloudfunctions.net/reRouteUser?uid={uid};trxid={trxid}', //display or change status
    MerchantUnApprovalURL: 'https://us-central1-aladdinapp-942fe.cloudfunctions.net/confirmPayment',
    PageTimeout: 500,
    Methods: {
      CREATE_TRANSACTION: 'CREATE_TRANSACTION',
      UPDATE_TRANSACTION: 'UPDATE_TRANSACTION',
      REVIEW: 'REVIEW',
      PAYMENT_PENDING: 'PAYMENT_PENDING',
      PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
      PAYMENT_FAILED: 'PAYMENT_FAILED'
    },
    firebaseCredential: {
      apiKey: "AIzaSyCoeUXmwEIwUdkF4BWZKLVaSGRcrQPLkvg",
      authDomain: "aladdinapp-942fe.firebaseapp.com",
      databaseURL: "https://aladdinapp-942fe.firebaseio.com",
      projectId: "aladdinapp-942fe",
      storageBucket: "aladdinapp-942fe.appspot.com",
      messagingSenderId: "617243251381"
    }
  };

}


exports.validateRequest = function(paymentInfo, MerchantPassword) {
  const toHash = MerchantPassword + paymentInfo.TxnID + paymentInfo.ServiceID
            + paymentInfo.PaymentID + paymentInfo.TxnStatus + paymentInfo.Amount
            + paymentInfo.CurrencyCode + paymentInfo.AuthCode + paymentInfo.OrderNumber
            + paymentInfo.Param6 + paymentInfo.Param7
  const HashValue = sha256(toHash);
  if (HashValue === paymentInfo.HashValue2) {
    return true;
  }
  else {
    return false;
  }
}

exports.generateApprovalURL =  function(MerchantApprovalURL, PaymentInfo) {
  return MerchantApprovalURL;
}

exports.generateUnApprovalURL =  function(MerchantUnApprovalURL, PaymentInfo) {
  return MerchantUnApprovalURL;
}
