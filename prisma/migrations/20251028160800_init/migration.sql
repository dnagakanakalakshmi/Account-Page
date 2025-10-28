-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CancelOrderType" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "cancelOrderBehavior" TEXT NOT NULL DEFAULT 'direct',
    "script" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CancelOrderType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountTabSettings" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountTabSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "shop" TEXT NOT NULL,
    "menuTabs" JSONB NOT NULL,
    "cancelOrderBehavior" TEXT NOT NULL,
    "script" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuSettings_pkey" PRIMARY KEY ("id")
);
