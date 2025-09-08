#!/bin/bash
# start.sh - 岡山スタンプラリー 簡単起動スクリプト

echo "🏯 岡山GPSスタンプラリー 起動中..."

# 色の定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Node.jsの確認
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.jsがインストールされていません${NC}"
    echo "https://nodejs.org/ からインストールしてください"
    exit 1
fi

# backendディレクトリの存在確認
if [ ! -d "backend" ]; then
    echo -e "${RED}❌ backendディレクトリが見つかりません${NC}"
    echo "プロジェクトルートから実行してください"
    exit 1
fi

# backendディレクトリに移動
cd backend

# package.jsonの確認
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}⚠️ package.jsonが見つかりません。作成中...${NC}"
    # package.jsonを作成（別途提供されたものを使用）
fi

# node_modulesの確認とインストール
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 依存関係をインストール中...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ npm install に失敗しました${NC}"
        exit 1
    fi
fi

# データベースの初期化
if [ ! -f "data/stamps.db" ]; then
    echo -e "${YELLOW}🗄️ データベースを初期化中...${NC}"
    if [ -f "../scripts/init-database.js" ]; then
        node ../scripts/init-database.js
    else
        echo -e "${YELLOW}⚠️ データベース初期化スクリプトが見つかりません${NC}"
    fi
fi

# TypeScriptのコンパイル
echo -e "${YELLOW}🔨 TypeScriptをコンパイル中...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ TypeScriptのコンパイルに失敗しました${NC}"
    exit 1
fi

echo -e "${GREEN}✅ セットアップ完了${NC}"
echo ""
echo -e "${GREEN}🚀 サーバーを起動中...${NC}"
echo ""

# サーバー起動
npm start &
SERVER_PID=$!

# 少し待ってからフロントエンドの起動指示
sleep 3
echo ""
echo -e "${GREEN}✅ バックエンドサーバーが起動しました${NC}"
echo -e "${YELLOW}📱 フロントエンドを起動するには:${NC}"
echo "   新しいターミナルで以下を実行:"
echo "   cd docs"
echo "   python -m http.server 8080"
echo "   または"
echo "   npx serve . -p 8080"
echo ""
echo -e "${GREEN}🌐 アクセスURL:${NC}"
echo "   バックエンド: http://localhost:3000"
echo "   フロントエンド: http://localhost:8080"
echo ""
echo -e "${YELLOW}停止するには Ctrl+C を押してください${NC}"

# サーバーの終了を待つ
wait $SERVER_PID
