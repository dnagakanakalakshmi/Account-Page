-- CreateTable
CREATE TABLE "CancelOrderType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "cancelOrderBehavior" TEXT NOT NULL DEFAULT 'direct',
    "script" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AccountTabSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "accountDetails" BOOLEAN NOT NULL DEFAULT true,
    "addresses" BOOLEAN NOT NULL DEFAULT true,
    "orders" BOOLEAN NOT NULL DEFAULT true,
    "wishlist" BOOLEAN NOT NULL DEFAULT false,
    "wishlistLink" TEXT,
    "credits" BOOLEAN NOT NULL DEFAULT false,
    "subscriptions" BOOLEAN NOT NULL DEFAULT false,
    "subscriptionsLink" TEXT,
    "cancelOrderBehavior" TEXT NOT NULL DEFAULT 'direct',
    "script" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MenuSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "shop" TEXT NOT NULL,
    "menuTabs" JSONB NOT NULL,
    "cancelOrderBehavior" TEXT NOT NULL,
    "script" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
