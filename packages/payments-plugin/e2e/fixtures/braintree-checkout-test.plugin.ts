/* eslint-disable */
import { Controller, Res, Get, Post, Body } from '@nestjs/common';
import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import { Response } from 'express';

import { clientToken, exposedShopClient } from '../braintree-dev-server';
import { proceedToArrangingPayment } from '../payment-helpers';
import {
    AddPaymentToOrderMutation,
    AddPaymentToOrderMutationVariables,
} from '../graphql/generated-shop-types';
import { ADD_PAYMENT } from '../graphql/shop-queries';
/**
 * This test controller returns the Braintree drop-in checkout page
 * with the client secret generated by the dev-server
 */
@Controller()
export class BraintreeTestCheckoutController {
    @Get('checkout')
    async client(@Res() res: Response): Promise<void> {
        res.send(`
<head>
  <title>Checkout</title>
  <script src="https://js.braintreegateway.com/web/dropin/1.33.3/js/dropin.min.js"></script>
</head>
<html>

<div id="dropin-container"></div>
<button id="submit-button">Purchase</button>
<div id="result"/>

<script>    
    var submitButton = document.querySelector('#submit-button');
    braintree.dropin.create({
        authorization: "${clientToken}",
        container: '#dropin-container',
        dataCollector: true,
        paypal: {
            flow: 'checkout',
            amount: 100,
            currency: 'GBP',
        },
    }, function (err, dropinInstance) {

        submitButton.addEventListener('click', function () {
            dropinInstance.requestPaymentMethod(async function (err, payload) {
                sendPayloadToServer(payload)
            });
        });

        if (dropinInstance.isPaymentMethodRequestable()) {
            // This will be true if you generated the client token
            // with a customer ID and there is a saved payment method
            // available to tokenize with that customer.
            submitButton.removeAttribute('disabled');
        }

        dropinInstance.on('paymentMethodRequestable', function (event) {
            console.log(event.type); // The type of Payment Method, e.g 'CreditCard', 'PayPalAccount'.
            console.log(event.paymentMethodIsSelected); // true if a customer has selected a payment method when paymentMethodRequestable fires
            submitButton.removeAttribute('disabled');
        });

        dropinInstance.on('noPaymentMethodRequestable', function () {
            submitButton.setAttribute('disabled', true);
        });
    });

    async function sendPayloadToServer(payload) {
        const response = await fetch('checkout', {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',       
                'Credentials': 'include',
            },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .catch(err => console.error(err))

        document.querySelector('#result').innerHTML = JSON.stringify(response)
        console.log(response)

    }
</script>

</html>
    `);
    }
    @Post('checkout')
    async test(@Body() body: Request, @Res() res: Response): Promise<void> {
        await proceedToArrangingPayment(exposedShopClient);
        const { addPaymentToOrder } = await exposedShopClient.query<
            AddPaymentToOrderMutation,
            AddPaymentToOrderMutationVariables
        >(ADD_PAYMENT, {
            input: {
                method: 'braintree-payment-method',
                metadata: body,
            },
        });
        console.log(addPaymentToOrder);

        res.send(addPaymentToOrder);
    }
}

/**
 * Test plugin for serving the Stripe intent checkout page
 */
@VendurePlugin({
    imports: [PluginCommonModule],
    controllers: [BraintreeTestCheckoutController],
})
export class BraintreeTestPlugin {}
