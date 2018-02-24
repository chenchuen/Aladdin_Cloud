const sha256 = require('sha256');

exports.getConfig = function() {
  return {
    eGHLurl: 'https://test2pay.ghl.com/IPGSG/Payment.aspx',
    ServiceID: 'sit',
    MerchantPassword: 'sit12345',
    MerchantName: 'E-Reno',
    MerchantReturnURL: 'https://us-central1-aladdinapp-942fe.cloudfunctions.net/confirmPayment',
    MerchantApprovalURL: 'https://us-central1-aladdinapp-942fe.cloudfunctions.net/confirmPayment',
    MerchantCallBackURL: 'https://us-central1-aladdinapp-942fe.cloudfunctions.net/confirmPayment', //display or change status
    MerchantUnApprovalURL: 'https://us-central1-aladdinapp-942fe.cloudfunctions.net/confirmPayment',
    PageTimeout: 500,
  };
}

exports.validateRequest = function(paymentInfo, MerchantPassword) {
  const toHash = MerchantPassword + paymentInfo.TxnID + paymentInfo.ServiceID
            + paymentInfo.PaymentID + paymentInfo.TxnStatus + paymentInfo.Amount
            + paymentInfo.CurrencyCode + paymentInfo.AuthCode + paymentInfo.OrderNumber
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
