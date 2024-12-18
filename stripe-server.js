require('dotenv').config();

const express = require('express');
const stripeReq = require('stripe');
const stripe = stripeReq(process.env.STRIPE_API_KEY);
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const crypto = require('crypto');
const { GoogleGenerativeAI } = require('@google/generative-ai');

app.use(cors());
app.use(bodyParser.json());

let validTokens = new Set();

const tokenExpiryTime = 10 * 60 * 1000; // 10 perc

function generateToken() {
  const token = crypto.randomBytes(16).toString('hex');
  validTokens.add(token);
  setTimeout(() => validTokens.delete(token), tokenExpiryTime);
  return token;
}

// STRIPE API
app.post('/create-checkout-session', async (req, res) => {
  const { items } = req.body;

  try {
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'huf',
        product_data: {
          name: item.name,
        },
        unit_amount: item.price * 100,
      },
      quantity: item.quantity,
    }));

    const token = generateToken();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `http://localhost:8100/payment/success?token=${token}`,
      cancel_url: `http://localhost:8100/payment/cancel?token=${token}`,
    });

    res.json({ id: session.id, token: token });
  } catch (error) {
    console.error('Error creating Stripe session:', error);
    res.status(500).send({ error: error.message });
  }
});

// GEMINI API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

app.post('/gemini-ai', async (req, res) => {
  const { prompt } = req.body;

  try {
    const result = await model.generateContent(prompt);
    const aiResponseText = result.response.text();
    res.json({ response: aiResponseText });
  } catch (error) {
    console.error('Error generating AI response:', error);
    res.status(500).send({ error: error.message });
  }
});

app.post('/validate-token', (req, res) => {
  const { token } = req.body;
  if (validTokens.has(token)) {
    validTokens.delete(token);
    res.json({ valid: true });
  } else {
    res.json({ valid: false });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));