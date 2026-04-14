// backend/src/routes/public.js
import express from "express";
import { listCategories } from "../controllers/categoriesController.js";
import { listDocumentsPublic } from "../controllers/publicDocumentController.js";

const router = express.Router();

router.get("/categories", listCategories);
router.get("/documents", listDocumentsPublic);

export default router;