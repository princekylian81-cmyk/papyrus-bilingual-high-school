CREATE TABLE IF NOT EXISTS applications (
  id CHAR(36) NOT NULL PRIMARY KEY,
  student_name VARCHAR(120) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender ENUM('Female', 'Male') NOT NULL,
  guardian_name VARCHAR(120) NOT NULL,
  father_phone VARCHAR(24) NOT NULL,
  mother_phone VARCHAR(24) NOT NULL,
  email VARCHAR(254) NOT NULL,
  desired_class ENUM('6e', 'Form I', 'Form II', 'Form III', 'Form IV', 'Form V', 'Lower Sixth', 'Upper Sixth') NOT NULL,
  education_type ENUM('General Education', 'Technical Commercial', 'Technical Industrial') NOT NULL,
  specialty VARCHAR(120) NULL,
  consent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'under_review', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
  decision_note VARCHAR(500) NULL,
  reviewed_at DATETIME NULL,
  payment_status ENUM('unpaid', 'declared') NOT NULL DEFAULT 'unpaid',
  payment_method ENUM('orange-money', 'mtn-momo', 'bank-transfer') NULL,
  payment_reference VARCHAR(80) NULL,
  payment_declared_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX applications_created_at_idx (created_at DESC),
  INDEX applications_status_created_at_idx (status, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS application_documents (
  id CHAR(36) NOT NULL PRIMARY KEY,
  application_id CHAR(36) NOT NULL,
  document_type ENUM('birth_certificate', 'previous_report_card', 'passport_photo') NOT NULL,
  passport_photo_number TINYINT UNSIGNED NULL,
  storage_key VARCHAR(80) NOT NULL UNIQUE,
  media_type ENUM('application/pdf', 'image/jpeg', 'image/png') NOT NULL,
  size_bytes INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT application_documents_size_check CHECK (size_bytes > 0 AND size_bytes <= 5242880),
  CONSTRAINT application_documents_photo_check CHECK (
    (document_type = 'passport_photo' AND passport_photo_number IS NOT NULL AND passport_photo_number BETWEEN 1 AND 4)
    OR (document_type <> 'passport_photo' AND passport_photo_number IS NULL)
  ),
  CONSTRAINT application_documents_application_fk FOREIGN KEY (application_id)
    REFERENCES applications(id) ON DELETE CASCADE,
  INDEX application_documents_application_id_idx (application_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;