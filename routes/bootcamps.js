const express = require('express');
const {
  getBootcamps,
  getBootcamp,
  createBootcamp,
  updateBootcamp,
  deleteBootcamp,
  getBootcampsInRadius,
  bootcampPhotoUpload,
} = require('../controllers/bootcamps');

const advancedResults = require('../middleware/advancedResults');
const Bootcamp = require('../models/Bootcamp');
const { protect, authorize } = require('../middleware/auth');

//Include other resource routers
const courseRouter = require('./courses');
const reviewsRouter = require('./reviews');

const router = express.Router();

//Re-router to other resource routers
router.use('/:bootcampId/courses', courseRouter);
router.use('/:bootcampId/reviews', reviewsRouter);

router.route('/radius/:zipcode/:distance').get(getBootcampsInRadius);

router
  .route('/')
  .get(advancedResults(Bootcamp, 'courses'), getBootcamps)
  .post(protect, authorize('admin', 'publisher'), createBootcamp);

router
  .route('/:id')
  .get(getBootcamp)
  .put(protect, authorize('admin', 'publisher'), updateBootcamp)
  .delete(protect, authorize('admin', 'publisher'), deleteBootcamp);

router.route('/:id/photo').put(bootcampPhotoUpload);

module.exports = router;
