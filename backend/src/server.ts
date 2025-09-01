// src/server.ts
import express from "express";
import cors from "cors";
import fs from "fs";

const app = express();
app.use(cors());
const PORT = 3000;

// JSONファイルからスタンプデータを読み込む
const stamps = JSON.parse(fs.readFileSync("data/stamps.json", "utf-8"));

// APIエンドポイント
app.get("/api/stamps", (req, res) => {
    res.json(stamps);
});

app.listen(PORT, () => {
    console.log(`✅ Backend running at http://localhost:${PORT}`);
});
