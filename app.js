// app.js

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Function to send SMS
async function sendSMS(content, number) {
    try {
        const response = await axios.post(
            'http://sms.telsam.com.tr:9587/sms/create',
            {
                type: 1,
                sendingType: 0,
                title: "Notification",
                content: content,
                number: number,
                encoding: 0,
                sender: "NEGANS",
                periodicSettings: null,
                sendingDate: null,
                validity: 60,
                pushSettings: null
            },
            {
                auth: {
                    username: process.env.API_USERNAME,
                    password: process.env.API_PASSWORD
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error(
            'Error sending SMS:',
            error.response ? error.response.data : error.message
        );
        throw error;
    }
}

// Endpoint for order created
app.post('/order-created', async (req, res) => {
    const { Name, PhoneNumber, OrderId } = req.body;
    if (!Name || !PhoneNumber || !OrderId) {
        return res.status(400).send({ error: 'Missing required fields' });
    }

    const messageContent = `Sayın ${Name}, siparişiniz alınmıştır. En kısa sürede hazırlanıp kargoya verilecektir.`;

    try {
        const smsResponse = await sendSMS(messageContent, PhoneNumber);
        res.send({ success: true, smsResponse });
    } catch (error) {
        res.status(500).send({ error: 'Failed to send SMS' });
    }
});

// Endpoint for order updated
app.post('/order-updated', async (req, res) => {
    const { Name, PhoneNumber, OrderId, TrackingCode } = req.body;
    if (!Name || !PhoneNumber || !OrderId || !TrackingCode) {
        return res.status(400).send({ error: 'Missing required fields' });
    }

    const messageContent = `Sayın ${Name} siparişiniz kargo şirketine teslim edildi. Kargo şirketi tarafından sizlere bildirim gönderilecektir.`;

    try {
        const smsResponse = await sendSMS(messageContent, PhoneNumber);
        res.send({ success: true, smsResponse });
    } catch (error) {
        res.status(500).send({ error: 'Failed to send SMS' });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
