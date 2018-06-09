const sha256 = require('sha256');

module.exports = function(config, req) {
  //TODO:verify the request whether got missing parameters
  let paymentInfo = req.body.paymentInfoWithID;
  paymentInfo.ServiceID = config.ServiceID;
  paymentInfo.MerchantReturnURL = config.MerchantReturnURL;
  const toHash = config.MerchantPassword + config.ServiceID + paymentInfo.PaymentID
        + config.MerchantReturnURL + paymentInfo.Amount + paymentInfo.CurrencyCode
        + paymentInfo.CustIP;
  const HashValue = sha256(toHash);
  paymentInfo.HashValue = HashValue;
  return paymentInfo;
};
