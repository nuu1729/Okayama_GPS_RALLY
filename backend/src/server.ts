// src/server.ts
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
const PORT = 3000;

// スタンプデータ（フロントの形式に合わせる）
const stamps = [
    { 
        id: 0,
        name: {
        ja: "西古松南部公園", 
        en: "Nishikomatsu Nanbu Park",
        ko: "니시코마츠 남부공원",
        zh: "西古松南部公园"
        },
        address: "〒700-0973 岡山県岡山市北区下中野",
        lat: 34.6433, lng: 133.9053, radius: 100,
        image: "images/location-0.jpg",
        icon: "🌳"
    },
    { 
        id: 1,
        name: {
        ja: "大元東公園", 
        en: "Omoto East Park",
        ko: "오모토 동쪽공원",
        zh: "大元东公园"
        },
        address: "〒700-0927 岡山県岡山市北区西古松250",
        lat: 34.6427, lng: 133.9089, radius: 100,
        image: "images/location-1.png",
        icon: "🌸"
    },
    { 
        id: 2,
        name: {
        ja: "岡山城", 
        en: "Okayama Castle",
        ko: "오카야마성",
        zh: "冈山城"
        },
        address: "〒700-0823 岡山県岡山市北区丸の内2-3-1",
        lat: 34.664788, lng: 133.935969, radius: 200,
        image: "images/location-2.jpg",
        icon: "🏯"
    },
    { 
        id: 3,
        name: {
        ja: "岡山後楽園", 
        en: "Okayama Korakuen",
        ko: "오카야마 고라쿠엔",
        zh: "冈山后乐园"
        },
        address: "〒703-8257 岡山県岡山市北区後楽園1-5",
        lat: 34.667697, lng: 133.936505, radius: 200,
        image: "images/location-3.jpg",
        icon: "🌺"
    }
];

// APIエンドポイント
app.get("/api/stamps", (req, res) => {
    res.json(stamps);
});

app.listen(PORT, () => {
    console.log(`✅ Backend running at http://localhost:${PORT}`);
});

console.log("🚀 正しい server.ts が起動しました！");
