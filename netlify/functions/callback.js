exports.handler = async function (event) {

    console.log("M-PESA CALLBACK RECEIVED");

    try {

        const callbackData = JSON.parse(event.body || "{}");

        console.log(
            "Callback data:",
            JSON.stringify(callbackData, null, 2)
        );

        const stkCallback =
            callbackData?.Body?.stkCallback;

        if (!stkCallback) {

            console.log("Invalid callback received.");

            return {
                statusCode: 400,
                body: JSON.stringify({
                    ResultCode: 1,
                    ResultDesc: "Invalid callback data"
                })
            };
        }

        const resultCode =
            stkCallback.ResultCode;

        const resultDescription =
            stkCallback.ResultDesc;

        const checkoutRequestID =
            stkCallback.CheckoutRequestID;

        console.log("Result Code:", resultCode);
        console.log("Result Description:", resultDescription);
        console.log("Checkout Request ID:", checkoutRequestID);


        // ------------------------------------------
        // PAYMENT SUCCESSFUL
        // ------------------------------------------

        if (resultCode === 0) {

            const metadata =
                stkCallback.CallbackMetadata?.Item || [];

            let amount = null;
            let mpesaReceiptNumber = null;
            let phoneNumber = null;
            let transactionDate = null;

            metadata.forEach(item => {

                if (item.Name === "Amount") {
                    amount = item.Value;
                }

                if (item.Name === "MpesaReceiptNumber") {
                    mpesaReceiptNumber = item.Value;
                }

                if (item.Name === "PhoneNumber") {
                    phoneNumber = item.Value;
                }

                if (item.Name === "TransactionDate") {
                    transactionDate = item.Value;
                }

            });


            console.log("PAYMENT SUCCESSFUL");
            console.log("Amount:", amount);
            console.log(
                "M-PESA Receipt:",
                mpesaReceiptNumber
            );
            console.log("Phone:", phoneNumber);
            console.log(
                "Transaction Date:",
                transactionDate
            );


            // IMPORTANT:
            // Later, save this information to a database.
            // Do not rely on the customer's browser
            // to confirm payment.


        } else {

            // ------------------------------------------
            // PAYMENT FAILED OR CANCELLED
            // ------------------------------------------

            console.log(
                "PAYMENT NOT COMPLETED:",
                resultDescription
            );

        }


        // ------------------------------------------
        // RESPOND TO SAFARICOM
        // ------------------------------------------

        return {

            statusCode: 200,

            body: JSON.stringify({

                ResultCode: 0,

                ResultDesc: "Callback received successfully"

            })

        };


    } catch (error) {

        console.error(
            "Callback error:",
            error
        );

        return {

            statusCode: 200,

            body: JSON.stringify({

                ResultCode: 0,

                ResultDesc: "Callback received"

            })

        };

    }

};