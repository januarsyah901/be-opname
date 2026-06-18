"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const body_parser_1 = __importDefault(require("body-parser"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = __importDefault(require("./config/swagger"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const customerRoutes_1 = __importDefault(require("./routes/customerRoutes"));
const vehicleRoutes_1 = __importDefault(require("./routes/vehicleRoutes"));
const categoryRoutes_1 = __importDefault(require("./routes/categoryRoutes"));
const sparepartRoutes_1 = __importDefault(require("./routes/sparepartRoutes"));
const stockRoutes_1 = __importDefault(require("./routes/stockRoutes"));
const stockMovementRoutes_1 = __importDefault(require("./routes/stockMovementRoutes"));
const opnameRoutes_1 = __importDefault(require("./routes/opnameRoutes"));
const transactionRoutes_1 = __importDefault(require("./routes/transactionRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const settingRoutes_1 = __importDefault(require("./routes/settingRoutes"));
const workOrderRoutes_1 = __importDefault(require("./routes/workOrderRoutes"));
const vehicleMasterRoutes_1 = __importDefault(require("./routes/vehicleMasterRoutes"));
const serviceCatalogRoutes_1 = __importDefault(require("./routes/serviceCatalogRoutes"));
const reminderRoutes_1 = __importDefault(require("./routes/reminderRoutes"));
const serviceBundleRoutes_1 = __importDefault(require("./routes/serviceBundleRoutes"));
const purchaseOrderRoutes_1 = __importDefault(require("./routes/purchaseOrderRoutes"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)({
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
}));
const allowedOrigins = [
    "https://auto-service-jet.vercel.app",
    "https://be-opname.vercel.app",
    "https://hallojanu.xyz",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3333",
    "http://localhost:5173",
    "http://localhost:4173",
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin))
            return callback(null, true);
        callback(new Error(`CORS: Origin "${origin}" tidak diizinkan`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));
app.use((0, morgan_1.default)("dev"));
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
const SWAGGER_UI_VERSION = "5.18.2";
const CDN_BASE = `https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}`;
const swaggerSetup = swagger_ui_express_1.default.setup(swagger_1.default, {
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
app.use("/api/v1/auth", authRoutes_1.default);
app.use("/api/v1/users", userRoutes_1.default);
app.use("/api/v1/customers", customerRoutes_1.default);
app.use("/api/v1/vehicles", vehicleRoutes_1.default);
app.use("/api/v1/categories", categoryRoutes_1.default);
app.use("/api/v1/spare-parts", sparepartRoutes_1.default);
app.use("/api/v1/stock", stockRoutes_1.default);
app.use("/api/v1/stock-movements", stockMovementRoutes_1.default);
app.use("/api/v1/opnames", opnameRoutes_1.default);
app.use("/api/v1/transactions", transactionRoutes_1.default);
app.use("/api/v1/reports", reportRoutes_1.default);
app.use("/api/v1/notifications", notificationRoutes_1.default);
app.use("/api/v1/settings", settingRoutes_1.default);
app.use("/api/v1/work-orders", workOrderRoutes_1.default);
app.use("/api/v1/vehicle-masters", vehicleMasterRoutes_1.default);
app.use("/api/v1/service-catalog", serviceCatalogRoutes_1.default);
app.use("/api/v1/reminders", reminderRoutes_1.default);
app.use("/api/v1/service-bundles", serviceBundleRoutes_1.default);
app.use("/api/v1/inventory/purchase-orders", purchaseOrderRoutes_1.default);
app.get("/api/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swagger_1.default);
});
app.use("/api/docs", swagger_ui_express_1.default.serve, swaggerSetup);
app.get("/", (_req, res) => {
    res.redirect("/api/docs");
});
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        error: {
            code: "NOT_FOUND",
            message: "Endpoint not found",
        },
    });
});
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({
        success: false,
        error: {
            code: err.code || "SERVER_ERROR",
            message: err.message || "Internal Server Error",
        },
    });
});
exports.default = app;
