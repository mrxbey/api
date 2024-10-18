// app.js

const express = require('express');
require('dotenv').config();
const axios = require('axios');

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// API Key authentication middleware
function apiKeyAuth(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    if (apiKey && apiKey === process.env.API_KEY) {
        next();
    } else {
        res.status(401).send({ error: 'Unauthorized' });
    }
}

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

// Function to clean the phone number
function cleanPhoneNumber(phoneNumber) {
    return phoneNumber.replace(/[^\d]/g, ''); // Remove non-numeric characters
}

// Endpoint for order created
app.post('/order-created', apiKeyAuth, async (req, res) => {
    const { Name, PhoneNumber, OrderId } = req.body;
    if (!Name || !PhoneNumber || !OrderId) {
        return res.status(400).send({ error: 'Missing required fields' });
    }
    const cleanedPhoneNumber = cleanPhoneNumber(PhoneNumber);
    const messageContent = `Sn. ${Name}, siparişiniz alınmıştır. En kısa sürede hazırlanıp mesai saatleri içerisinde Yurtiçi Kargo'ya teslim edilecektir.`;

    try {
        const smsResponse = await sendSMS(messageContent, cleanedPhoneNumber);
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
