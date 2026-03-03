'use strict';

const { Router } = require('express');
const ctrl = require('../controllers/categoryController');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.get('/',       ctrl.list);
router.post('/',      requireAuth, ctrl.create);
router.delete('/:id', requireAuth, ctrl.remove);

module.exports = router;
