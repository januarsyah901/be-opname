import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import bodyParser from "body-parser";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import customerRoutes from "./routes/customerRoutes";
import vehicleRoutes from "./routes/vehicleRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import sparepartRoutes from "./routes/sparepartRoutes";
import stockRoutes from "./routes/stockRoutes";
import stockMovementRoutes from "./routes/stockMovementRoutes";
import opnameRoutes from "./routes/opnameRoutes";
import transactionRoutes from "./routes/transactionRoutes";
import reportRoutes from "./routes/reportRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import settingRoutes from "./routes/settingRoutes";
import workOrderRoutes from "./routes/workOrderRoutes";
import vehicleMasterRoutes from "./routes/vehicleMasterRoutes";
import serviceCatalogRoutes from "./routes/serviceCatalogRoutes";
import reminderRoutes from "./routes/reminderRoutes";
import serviceBundleRoutes from "./routes/serviceBundleRoutes";

import purchaseOrderRoutes from "./routes/purchaseOrderRoutes";

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://cdn.jsdelivr.net",
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "*"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);
const allowedOrigins = [
  "https://auto-service-jet.vercel.app",
  "https://be-opname.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3333",
  "http://localhost:5173",
  "http://localhost:4173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: Origin "${origin}" tidak diizinkan`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const SWAGGER_UI_VERSION = "5.18.2";
const CDN_BASE = `https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}`;

const swaggerSetup = swaggerUi.setup(swaggerSpec, {
  customSiteTitle: "AutoService API Docs",
  customCssUrl: `${CDN_BASE}/swagger-ui.css`,
  customJs: [
    `${CDN_BASE}/swagger-ui-bundle.js`,
    `${CDN_BASE}/swagger-ui-standalone-preset.js`,
  ],
  swaggerOptions: {
    persistAuthorization: true,
    url: "/api/docs.json",
  },
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/vehicles", vehicleRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/spare-parts", sparepartRoutes);
app.use("/api/v1/stock", stockRoutes); 
app.use("/api/v1/stock-movements", stockMovementRoutes);
app.use("/api/v1/opnames", opnameRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/settings", settingRoutes);
app.use("/api/v1/work-orders", workOrderRoutes);
app.use("/api/v1/vehicle-masters", vehicleMasterRoutes);
app.use("/api/v1/service-catalog", serviceCatalogRoutes);
app.use("/api/v1/reminders", reminderRoutes);
app.use("/api/v1/service-bundles", serviceBundleRoutes);
app.use("/api/v1/inventory/purchase-orders", purchaseOrderRoutes);
app.get("/api/docs.json", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});
app.use("/api/docs", swaggerUi.serve, swaggerSetup);
app.get("/", (_req: Request, res: Response) => {
  res.redirect("/api/docs");
});

app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Endpoint not found",
    },
  });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || "SERVER_ERROR",
      message: err.message || "Internal Server Error",
    },
  });
});

export default app;
