'use strict';

const { Router } = require('express');
const ctrl = require('../controllers/commentController');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.get('/:postId',  ctrl.listByPost);
router.post('/',        ctrl.create);
router.delete('/:id',   requireAuth, ctrl.remove);

module.exports = router;
