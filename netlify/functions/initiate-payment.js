exports.handler = async function(event) {
  try {
    var body = JSON.parse(event.body);
    var phone = body.phone;
    var amount = body.amount;
    var userId = body.userId;

    var authRes = await fetch(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: 'Basic ' + Buffer.from(
            process.env.MPESA_CONSUMER_KEY + ':' + process.env.MPESA_CONSUMER_SECRET
          ).toString('base64')
        }
      }
    );
    var authData = await authRes.json();
    var token = authData.access_token;

    var timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    var password = Buffer.from(
      process.env.MPESA_SHORTCODE + process.env.MPESA_PASSKEY + timestamp
    ).toString('base64');

    var stkRes = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify({
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phone,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: 'https://heartlink254.netlify.app/.netlify/functions/mpesa-callback',
        AccountReference: 'HeartLink',
        TransactionDesc: 'Coin purchase',
      })
    });
    var stkData = await stkRes.json();

    return {
      statusCode: 200,
      body: JSON.stringify(stkData)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
