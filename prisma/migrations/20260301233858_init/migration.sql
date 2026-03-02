-- CreateTable
CREATE TABLE "User" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "pass" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "updated" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Settings" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updated" DATETIME NOT NULL
);
