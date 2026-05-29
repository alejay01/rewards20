"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const assetsDir = path_1.default.resolve(__dirname, "../../../client/public/assets");
// Ensure directory exists
if (!fs_1.default.existsSync(assetsDir)) {
    fs_1.default.mkdirSync(assetsDir, { recursive: true });
}
// 1x1 pixel transparent PNG buffer
const dummyPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const pngBuffer = Buffer.from(dummyPngBase64, "base64");
const assetsFiles = [
    "tbc-logo.png",
    "restaurant-front.jpg",
    "boudin-balls.jpg",
    "boudin-links.jpg",
    "flamin-hot-boudin-balls.jpg",
    "gumbo.jpg",
    "daiquiri.jpg",
    "boba.jpg",
    "sandwich.jpg",
    "pizza.jpg",
    "tea-cakes.jpg",
    "icon-192.png",
    "icon-512.png",
    "badge-rookie-roller.png",
    "badge-bayou-buddy.png",
    "badge-boudin-regular.png",
    "badge-hot-cheeto-hero.png",
    "badge-gumbo-gold.png",
    "badge-boudin-boss.png",
    "badge-vip-smokehouse-legend.png"
];
console.log("Writing asset placeholder image files...");
for (const file of assetsFiles) {
    const filePath = path_1.default.join(assetsDir, file);
    fs_1.default.writeFileSync(filePath, pngBuffer);
}
console.log("All 20 visual asset placeholders created successfully!");
process.exit(0);
