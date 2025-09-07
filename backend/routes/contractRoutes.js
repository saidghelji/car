const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const contractController = require('../controllers/contractController');

// Multer storage configuration for contract documents
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

// Routes
router.get('/', contractController.getContracts);
router.get('/:id', contractController.getContractById);
router.post('/', upload.fields([{ name: 'documents', maxCount: 10 }]), contractController.createContract);
router.put('/:id', upload.fields([{ name: 'documents', maxCount: 10 }]), contractController.updateContract);
router.delete('/:id/documents', contractController.deleteContractDocument || ((req, res) => res.status(404).json({ msg: 'Not implemented' })));
router.delete('/:id', contractController.deleteContract);

module.exports = router;

