'use strict';

const { Router } = require('express');
const ctrl = require('../controllers/postController');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.get('/',           ctrl.list);
router.get('/featured',   ctrl.featured);
router.get('/:slug',      ctrl.show);
router.post('/',          requireAuth, ctrl.create);
router.put('/:id',        requireAuth, ctrl.update);
router.delete('/:id',     requireAuth, ctrl.remove);
router.post('/:id/like',  ctrl.like);

module.exports = router;
