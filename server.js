import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MercadoPagoConfig, Preference } from "mercadopago";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || ""
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/create_preference", async (req, res) => {
  try {
    const { items } = req.body ?? {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Debes enviar al menos un producto." });
    }

    const sanitizedItems = items.map((item) => ({
      title: String(item.title || "Producto"),
      quantity: Number(item.quantity || 1),
      unit_price: Number(item.unit_price || 0),
      currency_id: "CLP",
      description: String(item.description || "")
    }));

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: sanitizedItems,
        back_urls: {
          success: `${process.env.FRONTEND_URL}/success`,
          failure: `${process.env.FRONTEND_URL}/failure`,
          pending: `${process.env.FRONTEND_URL}/pending`
        },
        auto_return: "approved",
        statement_descriptor: "DECANTS",
        external_reference: `pedido_${Date.now()}`
      }
    });

    return res.json({
      preferenceId: result.id,
      initPoint: result.init_point,
      sandboxInitPoint: result.sandbox_init_point
    });
  } catch (error) {
    console.error("Error creando preferencia:", error);
    return res.status(500).json({
      error: "No se pudo crear la preferencia de pago."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor listo en http://localhost:${PORT}`);
});