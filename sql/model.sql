CREATE TABLE
    "Operations" (
        "id" TEXT NOT NULL UNIQUE,
        "amount" REAL DEFAULT 0.0,
        "categoryId" TEXT DEFAULT '',
        "comment" TEXT DEFAULT '',
        "date" TEXT NOT NULL,
        "paytypeId" TEXT DEFAULT '',
        "state" INTEGER NOT NULL DEFAULT 0,
        "title" TEXT NOT NULL,
        "thirdpartyId" TEXT DEFAULT '',
        "fromWalletItemId" TEXT DEFAULT NULL,
        "toWalletItemId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        PRIMARY KEY("id")
    );