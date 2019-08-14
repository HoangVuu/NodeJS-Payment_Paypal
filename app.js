const express = require('express');
const ejs= require('ejs');
const bodyParser = require('body-parser');
const paypal = require('paypal-rest-sdk');

const app=express();
const urlencodedParser =bodyParser.urlencoded({extended:false})

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AUsM4OVQVKzeWfYJMqM0kVQAkz8WhAjG29KNu4Tv7Ea-wHeuWJrl4z8B2AELEa8_43LcfhLZf2D2uk0W',
    'client_secret': 'EHWx15MAtLnQfjP5SqXnLOZsGFKfX9j79FtcpfHVKNM-WGoGK8ccJWdkx_NI7pjlSAbTlgW4Adqf58_R'
});


//View engine:ejs
app.set('view engine', 'ejs');

//Routing
app.get('/',(req,res) =>res.render('index'));


app.listen(3000, () => {
    console.log('Server Started');
})

app.post('/pay', urlencodedParser, (req, res) => {
    const name = req.body.name;
    const price = req.body.price;
    
    const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://localhost:3000/success?total=" + price,
            "cancel_url": "http://localhost:3000/cancel"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": name,
                    "sku": "item",
                    "price": price,
                    "currency": "USD",
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "USD",
                "total": price
            },
            "description": "This is the payment description."
        }]
    };

    // console.log(create_payment_json);
    
    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            throw error;
        } 
        else {
            console.log(payment);
            for (let i = 0; i < payment.links.length; i++){
                if (payment.links[i].rel === 'approval_url'){
                    res.redirect(payment.links[i].href);
                }
            }
        }
    });
});


//Tạo route /success và route /cancel
app.get('/success', (req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    const total = req.query.total;

    const execute_payment_json = {
        "payer_id": payerId,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": total
            }
        }]
    };

    console.log(execute_payment_json);

    paypal.payment.execute(paymentId, execute_payment_json, (error, payment) => {
        if (error) {
            console.log(error.response);
            throw error;
        } 
        else {
            console.log('Get payment response');
            console.log(JSON.stringify(payment));
            res.send('Success');
        }
    });
});

app.get('/cancel', (req, res) => {
    res.send('Cancel');
});
