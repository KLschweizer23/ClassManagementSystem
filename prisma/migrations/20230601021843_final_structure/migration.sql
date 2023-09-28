/*
  Warnings:

  - You are about to drop the column `role` on the `teacher` table. All the data in the column will be lost.
  - You are about to drop the `_classtosubjectteacher` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `adviser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `grade` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subjectteacher` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_classtosubjectteacher` DROP FOREIGN KEY `_ClassToSubjectTeacher_A_fkey`;

-- DropForeignKey
ALTER TABLE `_classtosubjectteacher` DROP FOREIGN KEY `_ClassToSubjectTeacher_B_fkey`;

-- DropForeignKey
ALTER TABLE `adviser` DROP FOREIGN KEY `Adviser_teacherId_fkey`;

-- DropForeignKey
ALTER TABLE `class` DROP FOREIGN KEY `Class_adviserId_fkey`;

-- DropForeignKey
ALTER TABLE `grade` DROP FOREIGN KEY `Grade_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `grade` DROP FOREIGN KEY `Grade_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `grade` DROP FOREIGN KEY `Grade_subjectId_fkey`;

-- DropForeignKey
ALTER TABLE `subject` DROP FOREIGN KEY `Subject_subjectTeacherId_fkey`;

-- DropForeignKey
ALTER TABLE `subjectteacher` DROP FOREIGN KEY `SubjectTeacher_teacherId_fkey`;

-- AlterTable
ALTER TABLE `teacher` DROP COLUMN `role`;

-- DropTable
DROP TABLE `_classtosubjectteacher`;

-- DropTable
DROP TABLE `adviser`;

-- DropTable
DROP TABLE `category`;

-- DropTable
DROP TABLE `grade`;

-- DropTable
DROP TABLE `subjectteacher`;

-- CreateTable
CREATE TABLE `Type` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `percentage` DOUBLE NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Activity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `totalItems` INTEGER NOT NULL,
    `subjectId` INTEGER NOT NULL,
    `typeId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Score` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Class` ADD CONSTRAINT `Class_adviserId_fkey` FOREIGN KEY (`adviserId`) REFERENCES `Teacher`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subject` ADD CONSTRAINT `Subject_subjectTeacherId_fkey` FOREIGN KEY (`subjectTeacherId`) REFERENCES `Teacher`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Activity` ADD CONSTRAINT `Activity_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `Subject`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Activity` ADD CONSTRAINT `Activity_typeId_fkey` FOREIGN KEY (`typeId`) REFERENCES `Type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Score` ADD CONSTRAINT `Score_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
