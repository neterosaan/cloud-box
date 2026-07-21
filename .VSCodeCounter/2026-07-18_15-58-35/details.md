# Details

Date : 2026-07-18 15:58:35

Directory d:\\clodedrive

Total : 46 files,  5624 codes, 86 comments, 462 blanks, all 6172 lines

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [package-lock.json](/package-lock.json) | JSON | 3,885 | 0 | 1 | 3,886 |
| [package.json](/package.json) | JSON | 35 | 0 | 1 | 36 |
| [prisma/migrations/20260121054413\_init\_schema/migration.sql](/prisma/migrations/20260121054413_init_schema/migration.sql) | MS SQL | 46 | 15 | 20 | 81 |
| [prisma/migrations/20260617214642\_init/migration.sql](/prisma/migrations/20260617214642_init/migration.sql) | MS SQL | 6 | 13 | 6 | 25 |
| [prisma/migrations/20260617230539\_change\_clerk\_to\_supabaseauth/migration.sql](/prisma/migrations/20260617230539_change_clerk_to_supabaseauth/migration.sql) | MS SQL | 4 | 11 | 3 | 18 |
| [prisma/migrations/20260618000656\_email\_null\_condition/migration.sql](/prisma/migrations/20260618000656_email_null_condition/migration.sql) | MS SQL | 1 | 1 | 1 | 3 |
| [prisma/migrations/20260624050644\_fix\_tag\_user\_scope/migration.sql](/prisma/migrations/20260624050644_fix_tag_user_scope/migration.sql) | MS SQL | 4 | 11 | 4 | 19 |
| [prisma/migrations/20260630092458\_add\_upload\_sessions/migration.sql](/prisma/migrations/20260630092458_add_upload_sessions/migration.sql) | MS SQL | 26 | 15 | 10 | 51 |
| [prisma/migrations/20260630093549\_add\_upload\_sessions/migration.sql](/prisma/migrations/20260630093549_add_upload_sessions/migration.sql) | MS SQL | 6 | 13 | 2 | 21 |
| [prisma/migrations/20260718115336\_add\_soft\_delete/migration.sql](/prisma/migrations/20260718115336_add_soft_delete/migration.sql) | MS SQL | 2 | 2 | 2 | 6 |
| [src/app.js](/src/app.js) | JavaScript | 21 | 0 | 7 | 28 |
| [src/config/prisma.js](/src/config/prisma.js) | JavaScript | 6 | 0 | 4 | 10 |
| [src/config/s3.js](/src/config/s3.js) | JavaScript | 9 | 0 | 2 | 11 |
| [src/features/files/filesController.js](/src/features/files/filesController.js) | JavaScript | 149 | 0 | 28 | 177 |
| [src/features/files/filesRoutes.js](/src/features/files/filesRoutes.js) | JavaScript | 12 | 0 | 4 | 16 |
| [src/features/files/filesService.js](/src/features/files/filesService.js) | JavaScript | 174 | 0 | 43 | 217 |
| [src/features/files/filesValidation.js](/src/features/files/filesValidation.js) | JavaScript | 28 | 0 | 4 | 32 |
| [src/features/folders/foldersController.js](/src/features/folders/foldersController.js) | JavaScript | 126 | 0 | 36 | 162 |
| [src/features/folders/foldersRoutes.js](/src/features/folders/foldersRoutes.js) | JavaScript | 12 | 0 | 12 | 24 |
| [src/features/folders/foldersService.js](/src/features/folders/foldersService.js) | JavaScript | 221 | 0 | 41 | 262 |
| [src/features/folders/foldersValidation.js](/src/features/folders/foldersValidation.js) | JavaScript | 24 | 0 | 7 | 31 |
| [src/features/tags/tagsController.js](/src/features/tags/tagsController.js) | JavaScript | 114 | 0 | 24 | 138 |
| [src/features/tags/tagsRoutes.js](/src/features/tags/tagsRoutes.js) | JavaScript | 9 | 0 | 7 | 16 |
| [src/features/tags/tagsService.js](/src/features/tags/tagsService.js) | JavaScript | 45 | 0 | 18 | 63 |
| [src/features/tags/tagsValidation.js](/src/features/tags/tagsValidation.js) | JavaScript | 18 | 0 | 10 | 28 |
| [src/features/trash/trashController.js](/src/features/trash/trashController.js) | JavaScript | 0 | 0 | 1 | 1 |
| [src/features/trash/trashRoutes.js](/src/features/trash/trashRoutes.js) | JavaScript | 0 | 0 | 1 | 1 |
| [src/features/trash/trashService.js](/src/features/trash/trashService.js) | JavaScript | 0 | 0 | 1 | 1 |
| [src/features/trash/trashValidation.js](/src/features/trash/trashValidation.js) | JavaScript | 9 | 0 | 2 | 11 |
| [src/features/uploads/pipeline/extractFilePart.js](/src/features/uploads/pipeline/extractFilePart.js) | JavaScript | 27 | 0 | 9 | 36 |
| [src/features/uploads/pipeline/runUploadPipeline.js](/src/features/uploads/pipeline/runUploadPipeline.js) | JavaScript | 33 | 0 | 7 | 40 |
| [src/features/uploads/s3/s3KeyGenerator.js](/src/features/uploads/s3/s3KeyGenerator.js) | JavaScript | 7 | 0 | 1 | 8 |
| [src/features/uploads/s3/s3UploadService.js](/src/features/uploads/s3/s3UploadService.js) | JavaScript | 36 | 0 | 11 | 47 |
| [src/features/uploads/streams/mimeTypeSnifferTransform.js](/src/features/uploads/streams/mimeTypeSnifferTransform.js) | JavaScript | 52 | 1 | 8 | 61 |
| [src/features/uploads/streams/mimeTypeValidatorTransform.js](/src/features/uploads/streams/mimeTypeValidatorTransform.js) | JavaScript | 24 | 0 | 5 | 29 |
| [src/features/uploads/streams/sizeGuardTransform.js](/src/features/uploads/streams/sizeGuardTransform.js) | JavaScript | 32 | 0 | 6 | 38 |
| [src/features/uploads/uploadsConfig.js](/src/features/uploads/uploadsConfig.js) | JavaScript | 27 | 1 | 12 | 40 |
| [src/features/uploads/uploadsController.js](/src/features/uploads/uploadsController.js) | JavaScript | 49 | 2 | 10 | 61 |
| [src/features/uploads/uploadsRoutes.js](/src/features/uploads/uploadsRoutes.js) | JavaScript | 8 | 0 | 4 | 12 |
| [src/features/uploads/uploadsService.js](/src/features/uploads/uploadsService.js) | JavaScript | 122 | 0 | 38 | 160 |
| [src/features/uploads/uploadsValidation.js](/src/features/uploads/uploadsValidation.js) | JavaScript | 14 | 1 | 2 | 17 |
| [src/lib/normalizeError.js](/src/lib/normalizeError.js) | JavaScript | 21 | 0 | 5 | 26 |
| [src/lib/pagination.js](/src/lib/pagination.js) | JavaScript | 16 | 0 | 4 | 20 |
| [src/lib/uploadCleanupJob.js](/src/lib/uploadCleanupJob.js) | JavaScript | 98 | 0 | 24 | 122 |
| [src/middlewares/authMiddleware.js](/src/middlewares/authMiddleware.js) | JavaScript | 57 | 0 | 11 | 68 |
| [src/server.js](/src/server.js) | JavaScript | 9 | 0 | 3 | 12 |

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)