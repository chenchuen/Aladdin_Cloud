
module.exports = function(config, services, admin, req) {
  const dateNow = admin.database.ServerValue.TIMESTAMP;
  var paymentInfo = req.body;

  if(!services.validateRequest(paymentInfo, config.MerchantPassword)){
    throw new Error("Invalid Hash");
  }

  var refToPayment = admin.database().ref('Payments/' + paymentInfo.PaymentID);
  var refToTransaction = admin.database().ref('Transactions/' + paymentInfo.OrderNumber);
  try {
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
  } catch (error) {
    return 'Failed';
  }

  return 'Success';
};
