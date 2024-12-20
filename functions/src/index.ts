import * as functions from "firebase-functions";
import Stripe from "stripe";
import {GoogleGenerativeAI} from "@google/generative-ai";
import crypto from "crypto";
import cors from "cors";
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import {Firestore} from "@google-cloud/firestore";

dotenv.config();

const stripeSecretKey = process.env.STRIPE_API_KEY;
if (!stripeSecretKey) {
  throw new Error("STRIPE_API_KEY is not defined");
}
const stripe = new Stripe(stripeSecretKey);

const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  throw new Error("GEMINI_API_KEY is not defined");
}
const genAI = new GoogleGenerativeAI(geminiApiKey);

const app = express();
app.use(cors());
app.use(bodyParser.json());

const firestore = new Firestore();

const tokenExpiryTime = 5 * 60 * 1000;

/**
 * Generates a random token and adds it to the validTokens set.
 * The token expires after a set period.
 * @return {string} The generated token.
 */
function generateToken(): string {
  const token = crypto.randomBytes(16).toString("hex");
  const expirationTime = Date.now() + tokenExpiryTime;

  firestore.collection("validTokens")
    .doc(token).set({expiresAt: expirationTime});

  setTimeout(() => {
    firestore.collection("validTokens").doc(token).delete();
  }, tokenExpiryTime);

  return token;
}

export const validateToken = functions.https.onRequest((req, res) => {
  cors()(req, res, async () => {
    try {
      const {token} = req.body;
      const tokenDoc = await firestore.collection("validTokens")
        .doc(token).get();
      if (tokenDoc.exists) {
        const {expiresAt} = tokenDoc.data()!;
        if (Date.now() < expiresAt) {
          await firestore.collection("validTokens").doc(token).delete();
          res.json({valid: true});
          return;
        }
      }
      res.json({valid: false});
    } catch (error) {
      console.error("Error validating token:", error);
      res.status(500).send({error: (error as Error).message});
    }
  });
});

export const stripeCheckout = functions.https.onRequest((req, res) => {
  cors()(req, res, async () => {
    try {
      const {items} = req.body;

      const lineItems = items.map((
        item: {
          name: string;
          price: number;
          quantity: number}) =>
        ({
          price_data: {
            currency: "huf",
            product_data: {
              name: item.name,
            },
            unit_amount: item.price * 100,
          },
          quantity: item.quantity,
        }));

      const token = generateToken();

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: `https://iruhabolt.web.app/payment/success?token=${token}`,
        cancel_url: `https://iruhabolt.web.app/payment/cancel?token=${token}`,
      });

      res.json({id: session.id, token});
    } catch (error) {
      console.error("Error creating Stripe session:", error);
      res.status(500).send({error: (error as Error).message});
    }
  });
});

export const geminiAiPrompt = functions.https.onRequest((req, res) => {
  cors()(req, res, async () => {
    try {
      const {prompt} = req.body;
      const model = genAI.getGenerativeModel({model: "gemini-1.5-flash-8b"});

      const result = await model.generateContent(prompt);
      const aiResponseText = result.response.text();

      res.json({response: aiResponseText});
    } catch (error) {
      console.error("Error generating AI response:", error);
      res.status(500).send({error: (error as Error).message});
    }
  });
});
