-- MySQL dump 10.13  Distrib 9.6.0, for Win64 (x86_64)
--
-- Host: localhost    Database: repositorio_tic
-- ------------------------------------------------------
-- Server version	8.4.3

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(100) DEFAULT NULL,
  `details` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `backups`
--

DROP TABLE IF EXISTS `backups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `backups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `file_path` varchar(255) NOT NULL,
  `created_by` int NOT NULL,
  `tipo` enum('manual','programado') DEFAULT 'manual',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `backups_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `backups`
--

LOCK TABLES `backups` WRITE;
/*!40000 ALTER TABLE `backups` DISABLE KEYS */;
/*!40000 ALTER TABLE `backups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Desarrollo Web Profesional','...'),(2,'Seguridad en el Desarrollo de Aplicaciones','Buenas prácticas y OWASP'),(3,'Administración de Base de Datos','Modelado, SQL y administración de SGBD'),(4,'Matemáticas para Ingeniería II','Cálculo y álgebra para ingeniería'),(9,'Bases de Datos','...');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_categories`
--

DROP TABLE IF EXISTS `document_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_categories` (
  `document_id` int NOT NULL,
  `category_id` int NOT NULL,
  PRIMARY KEY (`document_id`,`category_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `document_categories_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`),
  CONSTRAINT `document_categories_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_categories`
--

LOCK TABLES `document_categories` WRITE;
/*!40000 ALTER TABLE `document_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `document_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documentos`
--

DROP TABLE IF EXISTS `documentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text,
  `archivo_url` varchar(255) NOT NULL,
  `thumbnail` varchar(255) DEFAULT NULL,
  `fecha_publicacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_by` int NOT NULL,
  `status` enum('publicado','borrador','archivado') DEFAULT 'borrador',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `category_id` int DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `size` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  KEY `created_by` (`created_by`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documentos`
--

LOCK TABLES `documentos` WRITE;
/*!40000 ALTER TABLE `documentos` DISABLE KEYS */;
INSERT INTO `documentos` VALUES (1,'matematicas 3','PDF','/uploads/1776139165593-buh4e3.pdf',NULL,'2026-04-13 20:59:25',3,'borrador','2026-04-14 03:59:25','2026-04-14 03:59:25',4,'Reporte de PrÃ¡ctica.pdf','application/pdf',571012),(2,'Prueba','Prueba','/uploads/1776140347297-88mdpy.pdf',NULL,'2026-04-13 21:19:07',2,'borrador','2026-04-14 04:19:07','2026-04-14 04:19:07',1,'Reporte de PrÃ¡ctica.pdf','application/pdf',571012),(3,'pruebaaaa3','PDF','/uploads/1776142222657-nke5v8.pdf',NULL,'2026-04-13 21:50:22',3,'borrador','2026-04-14 04:50:22','2026-04-14 04:50:22',1,'CALIFICACIONES.pdf','application/pdf',177310);
/*!40000 ALTER TABLE `documentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text,
  `archivo_url` varchar(255) NOT NULL,
  `thumbnail` varchar(255) DEFAULT NULL,
  `fecha_publicacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_by` int NOT NULL,
  `status` enum('publicado','borrador','archivado') DEFAULT 'borrador',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `category_id` int DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `size` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `fk_documents_category` (`category_id`),
  CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_documents_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
INSERT INTO `documents` VALUES (1,'Prueba','Prueba subida','/uploads/72c294846c23235672b1721f915ee444',NULL,NULL,2,'publicado','2026-04-13 21:08:12','2026-04-13 21:26:09',1,NULL,NULL,NULL),(2,'Prueba','Prueba subida','/uploads/067dd1c420a2a7ef3a0d5e72adcc7b2c',NULL,'2026-04-13 23:24:01',2,'publicado','2026-04-13 21:37:25','2026-04-14 06:24:01',1,'practica_mongodb.pdf','application/pdf',699033),(3,'Prueba2','Subida desde curl','/uploads/1776145355248-gs6aq2.pdf',NULL,'2026-04-13 23:24:01',2,'publicado','2026-04-14 05:42:35','2026-04-14 06:24:01',NULL,'Lista de cotejo 2do parcial proyecto 2026.pdf','application/pdf',232282),(4,'ARCHIVO 1','PDF','/uploads/1776145604084-5md5wt.pdf',NULL,'2026-04-13 22:46:44',3,'publicado','2026-04-14 05:46:44','2026-04-14 06:15:38',4,'CATAÌLOGO MAYO .pdf','application/pdf',10364304),(5,'a ver si sale','PDF','/uploads/1776147933971-po0i4a.pdf',NULL,'2026-04-13 23:25:55',3,'publicado','2026-04-14 06:25:33','2026-04-14 06:25:55',3,'CALIFICACIONES (1).pdf','application/pdf',177310),(6,'YAMEQUIERODORMIR','PDF','http://localhost:3000/uploads/1776150579264-532030-politica_de_privacidad.pdf',NULL,'2026-04-14 00:09:39',3,'publicado','2026-04-14 07:09:39','2026-04-14 07:09:39',NULL,'politica de privacidad.pdf','application/pdf',117626),(7,'lista de cotejo','PDF','http://localhost:3000/uploads/1776151891601-605338-Lista_de_cotejo_2do_parcial_proyecto_2026_(1).pdf',NULL,'2026-04-14 00:31:32',3,'publicado','2026-04-14 07:31:31','2026-04-14 07:31:31',NULL,'Lista de cotejo 2do parcial proyecto 2026 (1).pdf','application/pdf',118544);
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `interactions`
--

DROP TABLE IF EXISTS `interactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `interactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `document_id` int NOT NULL,
  `user_id` int NOT NULL,
  `tipo` enum('visualizacion','comentario','descarga','like') NOT NULL,
  `contenido` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `document_id` (`document_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `interactions_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`),
  CONSTRAINT `interactions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `interactions`
--

LOCK TABLES `interactions` WRITE;
/*!40000 ALTER TABLE `interactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `interactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `correo` varchar(200) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('alumno','maestro','admin','superadmin') NOT NULL DEFAULT 'alumno',
  `sanamente_certificado` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `correo` (`correo`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'juan fabian moreno lopez','tic-300083@utnay.edu.mx','$2b$10$nobrct4y.5qv.T8CskfdJOaY.vMN3yzAadzjVD2W2FP/ry9IA/nMS','alumno',0,'2026-04-01 07:04:27','2026-04-01 07:04:27',NULL),(2,'Admin UTN','admin@utn.mx','$2b$10$LsvL/yJlLBI8X11zmPJUouiJmJ/StjumX19D1DyW.VI/cTgcBMA.e','admin',0,'2026-04-07 06:22:15','2026-04-07 06:22:15',NULL),(3,'Maestro Prueba','maestro@utn.mx','$2b$10$4VdJrnxqU9UgeEsvL1cnhuaT1yBeOtztuiBYVr91kBTdrzJrJZZbS','maestro',0,'2026-04-13 22:31:10','2026-04-13 22:31:10',NULL),(4,'fabianpruebaregister','gt-300083@utnay.edu.mx','$2b$10$Dedeqff7XfikI4OjQEmMTOXBQcJxTC3VCeDezMx2rRCeFEc14t4f6','alumno',0,'2026-04-14 00:43:10','2026-04-14 00:43:10',NULL),(5,'usuarioprueba2','correo@prueba.mx','$2b$10$a73ECScX2YyGySYh9c3EW.LvD0XMw2p5kXHy4H8e7c8bV/yE.STLm','alumno',0,'2026-04-14 01:08:47','2026-04-14 01:08:47',NULL),(6,'admin2','admin@admin.com','$2b$10$tgKmg/ZmmqXo8a5EnQEOK.LmxNruV9WBDyYVSP4Atwkvlq1DDUr32','admin',0,'2026-04-14 06:29:35','2026-04-14 06:29:35',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `rol` enum('alumno','maestro','admin') DEFAULT 'alumno',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (2,'Admin','admin@email.com',NULL,'alumno'),(5,'alexita','alexaa@gmail.com',NULL,'alumno'),(6,'Juan','juan@test.com','$2b$10$arGa6ctUZMyMDEmWfqduuOttk/59ENlKJBSlFRnDej/yKgrN1J5/K','alumno'),(8,NULL,'tic-300083@utnay.edu.mx','$2b$10$O6yruNwZmHt9j2rw4E0ureFqEHZa1S5w0zYHnzvWdTxLk22Ylo8wS','alumno');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-14  0:35:37
