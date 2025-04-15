// app.js (Correct version - No changes needed for the ECONNREFUSED error)

const express = require('express');
require('dotenv').config();
const axios = require('axios');

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// API Key authentication middleware
function apiKeyAuth(req, res, next) {
    const apiKey = req.headers['x-api-key']; // Standard header for API keys
    if (apiKey && apiKey === process.env.API_KEY) {
        next(); // API key is valid, proceed
    } else {
        console.log('Unauthorized attempt. Missing or incorrect API Key.');
        res.status(401).send({ error: 'Unauthorized' });
    }
}

// Function to send SMS
async function sendSMS(content, number) { // 'number' will be received as a string
    try {
        console.log(`Attempting to send SMS to: ${number} with content: "${content}"`);
        const response = await axios.post(
            'http://sms.telsam.com.tr:9587/sms/create', // Correct Telsam URL
            {
                type: 1,
                sendingType: 0,
                title: "Notification",
                content: content,
                number: number, // Using the string 'number' directly
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
        console.log('SMS sent successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error(
            'Error sending SMS:',
            error.response ? JSON.stringify(error.response.data, null, 2) : error.message
        );
        // Log the error code if available (like ECONNREFUSED, ENOTFOUND etc.)
        if (error.code) {
             console.error('Network Error Code:', error.code);
        }
         // Log the address it tried to connect to if available
        if (error.address) {
             console.error('Attempted Connection Address:', error.address);
        }
        if (error.response) {
            console.error('SMS API Status:', error.response.status);
            console.error('SMS API Headers:', JSON.stringify(error.response.headers, null, 2));
        }
        throw error; // Re-throw the error
    }
}

// Function to clean the phone number - removes ALL non-digit characters
function cleanPhoneNumber(phoneNumber) {
    // String.prototype.replace() returns a string
    const cleaned = phoneNumber.replace(/[^\d]/g, '');
    console.log(`Original PhoneNumber: ${phoneNumber}, Cleaned PhoneNumber: ${cleaned}`);
    return cleaned; // Returns a STRING
}

// Endpoint for order created - Requires API Key
app.post('/order-created', apiKeyAuth, async (req, res) => {
    console.log('Received POST request on /order-created');
    console.log('Request Body:', JSON.stringify(req.body, null, 2));

    const { Name, PhoneNumber, OrderId } = req.body;
    if (!Name || !PhoneNumber || !OrderId) {
        console.log('Missing required fields in request body.');
        return res.status(400).send({ error: 'Missing required fields: Name, PhoneNumber, OrderId' });
    }

    const cleanedPhoneNumber = cleanPhoneNumber(PhoneNumber); // Gets a string
    const messageContent = `Sn. ${Name}, siparişiniz alınmıştır. En kısa sürede hazırlanıp mesai saatleri içerisinde Yurtiçi Kargo'ya teslim edilecektir.`;

    try {
        const smsResponse = await sendSMS(messageContent, cleanedPhoneNumber);
        res.send({ success: true, message: "SMS scheduled successfully.", smsApiResponse: smsResponse });
    } catch (error) {
        // Send specific error code if available
        const errorCode = error.code || (error.response ? error.response.status : 500);
        res.status(500).send({ error: 'Failed to send SMS', details: error.message, code: errorCode });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});