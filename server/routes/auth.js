'use strict';

const { Router } = require('express');
const ctrl = require('../controllers/authController');

const router = Router();

router.post('/login',  ctrl.login);
router.post('/logout', ctrl.logout);
router.get('/check',   ctrl.check);

module.exports = router;
