const https = require("https");

function httpsRequest(options, body = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = "";

            res.on("data", (chunk) => {
                data += chunk;
            });

            res.on("end", () => {
                try {
                    data = JSON.parse(data);
                } catch {}

                resolve({
                    statusCode: res.statusCode,
                    body: data
                });
            });
        });

        req.on("error", reject);

        if (body) {
            req.write(body);
        }

        req.end();
    });
}

function getTimestamp() {
    const now = new Date();

    return (
        now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, "0") +
        String(now.getDate()).padStart(2, "0") +
        String(now.getHours()).padStart(2, "0") +
        String(now.getMinutes()).padStart(2, "0") +
        String(now.getSeconds()).padStart(2, "0")
    );
}

exports.handler = async (event) => {

    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({
                success: false,
                message: "Method not allowed."
            })
        };
    }

    try {

        const data = JSON.parse(event.body || "{}");

        const phone = String(data.phone || "").trim();
        const amount = Number(data.amount);

        if (amount !== 500) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    success: false,
                    message: "Invalid test amount."
                })
            };
        }

        if (!/^2547\d{8}$/.test(phone)) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    success: false,
                    message: "Enter a valid number such as 254712345678."
                })
            };
        }

        const consumerKey =
            process.env.DARAJA_CONSUMER_KEY;

        const consumerSecret =
            process.env.DARAJA_CONSUMER_SECRET;

        const shortcode =
            process.env.DARAJA_SHORTCODE;

        const passkey =
            process.env.DARAJA_PASSKEY;

        const callbackUrl =
            process.env.DARAJA_CALLBACK_URL;

        if (
            !consumerKey ||
            !consumerSecret ||
            !shortcode ||
            !passkey ||
            !callbackUrl
        ) {
            return {
                statusCode: 500,
                body: JSON.stringify({
                    success: false,
                    message: "Daraja configuration is incomplete."
                })
            };
        }

        // Get Daraja access token

        const credentials = Buffer
            .from(`${consumerKey}:${consumerSecret}`)
            .toString("base64");

        const tokenResponse = await httpsRequest({
            hostname: "sandbox.safaricom.co.ke",
            path: "/oauth/v1/generate?grant_type=client_credentials",
            method: "GET",
            headers: {
                Authorization: `Basic ${credentials}`
            }
        });

        const accessToken =
            tokenResponse.body?.access_token;

        if (!accessToken) {
            console.error(tokenResponse.body);

            return {
                statusCode: 502,
                body: JSON.stringify({
                    success: false,
                    message:
                        "Could not obtain Daraja sandbox access token."
                })
            };
        }

        // Create STK password

        const timestamp = getTimestamp();

        const password = Buffer
            .from(
                `${shortcode}${passkey}${timestamp}`
            )
            .toString("base64");

        const transactionType =
            process.env.DARAJA_TRANSACTION_TYPE ||
            "CustomerPayBillOnline";

        // Send STK Push

        const stkRequest = {

            BusinessShortCode: shortcode,

            Password: password,

            Timestamp: timestamp,

            TransactionType: transactionType,

            Amount: amount,

            PartyA: phone,

            PartyB: shortcode,

            PhoneNumber: phone,

            CallBackURL: callbackUrl,

            AccountReference: "SmartLoans",

            TransactionDesc: "Registration Fee"
        };

        const stkResponse = await httpsRequest({

            hostname: "sandbox.safaricom.co.ke",

            path: "/mpesa/stkpush/v1/processrequest",

            method: "POST",

            headers: {
                Authorization:
                    `Bearer ${accessToken}`,

                "Content-Type":
                    "application/json"
            }

        }, JSON.stringify(stkRequest));

        console.log(
            "Daraja STK response:",
            JSON.stringify(stkResponse.body)
        );

        if (
            stkResponse.body &&
            String(stkResponse.body.ResponseCode) === "0"
        ) {

            return {

                statusCode: 200,

                body: JSON.stringify({

                    success: true,

                    message:
                        "STK Push sent. Check the sandbox test phone for the payment prompt.",

                    merchantRequestID:
                        stkResponse.body.MerchantRequestID || null,

                    checkoutRequestID:
                        stkResponse.body.CheckoutRequestID || null
                })
            };
        }

        return {

            statusCode: 400,

            body: JSON.stringify({

                success: false,

                message:
                    stkResponse.body?.errorMessage ||
                    stkResponse.body?.ResponseDescription ||
                    "Daraja rejected the STK Push request."
            })
        };

    } catch (error) {

        console.error(
            "STK Push error:",
            error
        );

        return {

            statusCode: 500,

            body: JSON.stringify({

                success: false,

                message:
                    "Payment server error."
            })
        };
    }
};