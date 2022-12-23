CREATE TABLE
    "Operations" (
        "id" TEXT NOT NULL UNIQUE,
        "amount" REAL DEFAULT 0.0,
        "categoryId" TEXT NOT NULL,
        "comment" TEXT NOT NULL,
        "date" TEXT NOT NULL,
        "paytypeId" TEXT NOT NULL,
        "state" INTEGER NOT NULL DEFAULT 0,
        "title" TEXT NOT NULL,
        "thirdpartyId" TEXT NOT NULL,
        "type" TEXT NOT NULL DEFAULT 'operation',
        "fromWalletItemId" TEXT DEFAULT NULL, 
        "toWalletItemId" TEXT NOT NULL, 
        PRIMARY KEY("id")
    );

