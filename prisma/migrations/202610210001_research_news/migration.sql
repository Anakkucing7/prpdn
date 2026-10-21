-- CreateTable
CREATE TABLE `NewsSource` (
    `id` VARCHAR(40) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `homepageUrl` VARCHAR(768) NOT NULL,
    `feedUrl` VARCHAR(768) NULL,
    `permissionNote` TEXT NOT NULL,
    `syncEnabled` BOOLEAN NOT NULL DEFAULT false,
    `catalogInitialized` BOOLEAN NOT NULL DEFAULT false,
    `version` INTEGER NOT NULL DEFAULT 1,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NewsArticle` (
    `id` VARCHAR(191) NOT NULL,
    `canonicalUrl` VARCHAR(768) NOT NULL,
    `sourceId` VARCHAR(40) NOT NULL DEFAULT 'brin',
    `title` VARCHAR(300) NOT NULL,
    `excerpt` VARCHAR(600) NOT NULL,
    `category` VARCHAR(80) NOT NULL,
    `imageUrl` VARCHAR(1024) NOT NULL,
    `imageAlt` VARCHAR(300) NOT NULL,
    `attribution` VARCHAR(120) NOT NULL,
    `publishedAt` DATETIME(3) NOT NULL,
    `status` VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `editorialOverride` BOOLEAN NOT NULL DEFAULT true,
    `originalMetadata` JSON NULL,
    `editorId` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `NewsArticle_canonicalUrl_key`(`canonicalUrl`),
    INDEX `NewsArticle_status_featured_publishedAt_idx`(`status`, `featured`, `publishedAt`),
    INDEX `NewsArticle_sourceId_idx`(`sourceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `NewsArticle` ADD CONSTRAINT `NewsArticle_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `NewsSource`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
