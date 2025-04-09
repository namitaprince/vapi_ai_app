const axios = require('axios');
const dotenv = require('dotenv');
const { DateTime } = require('luxon');
const chrono = require('chrono-node');

dotenv.config();

const makeOutboundCall = async (req, res) => {
  try {
    const { fromNumber, toNumber, callerName, additionalInfo } = req.body; // User enters Twilio number

    if (!fromNumber || !toNumber || !callerName) {
      return res.status(400).json({ error: 'Both from and to numbers are required' });
    }

    // Automatically get the correct Vapi Phone Number ID from .env
    const vapiPhoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
    const vapiAssistantId = process.env.VAPI_ASSISTANT_ID;
    const vapiApiKey = process.env.VAPI_API_KEY;

    if (!vapiPhoneNumberId || !vapiAssistantId || !vapiApiKey) {
      return res.status(500).json({ error: 'Vapi API credentials are missing in server config' });
    }

    // Create a personalized message for the AI assistant
    const userMessage = ` ${additionalInfo || "I need assistance with booking an appointment."}`;

    // Construct API request payload
    const requestData = {
      assistantId: vapiAssistantId,
      phoneNumberId: vapiPhoneNumberId, // Use stored Vapi ID instead of user input
      customer: {
        number: toNumber, // Call recipient
        numberE164CheckEnabled: false,
      },
      assistantOverrides: {
        variableValues: {
          name: callerName, // Pass caller name for greeting
          userMessage: userMessage // Send custom user message
        }
      }
    };

    // Make the API request
    const response = await axios.post(
      'https://api.vapi.ai/call/phone',
      requestData,
      {
        headers: {
          Authorization: `Bearer ${vapiApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({
      message: 'Call initiated successfully!',
      callId: response.data.id,
      listenUrl: response.data.monitor?.listenUrl || '',
      controlUrl: response.data.monitor?.controlUrl || '',
    });
  } catch (error) {
    console.error('Error initiating call:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to initiate call', details: error.response?.data || error.message });
  }
};

const checkAvailability = (req, res) => {
    try {
      const { input_text } = req.body;
  
      if (!input_text) {
        return res.status(400).json({ error: 'input_text is required' });
      }
  
      // Use chrono to parse natural language
      const parsedDate = chrono.parseDate(input_text);
  
      if (!parsedDate) {
        return res.status(400).json({ error: 'Could not parse input_text as a valid date' });
      }
  
      // Convert parsed JS Date to Luxon DateTime in IST
      const istDateTime = DateTime.fromJSDate(parsedDate, { zone: 'Asia/Kolkata' });
  
      // Convert to ISO UTC format
      const isoDateTime = istDateTime.toUTC().toISO();
  
      return res.json({
        message: 'Parsed input_text successfully',
        isoDateTime,
      });
  
    } catch (error) {
      console.error('Error parsing input_text:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

module.exports = { makeOutboundCall, checkAvailability };
