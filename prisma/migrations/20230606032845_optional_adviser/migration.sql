-- DropForeignKey
ALTER TABLE `class` DROP FOREIGN KEY `Class_adviserId_fkey`;

-- AlterTable
ALTER TABLE `class` MODIFY `adviserId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Class` ADD CONSTRAINT `Class_adviserId_fkey` FOREIGN KEY (`adviserId`) REFERENCES `Teacher`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
