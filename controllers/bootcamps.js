const Bootcamp = require('../models/Bootcamp');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const geocoder = require('../utils/geocoder');
const path = require('path');

//@desc Get all Bootcamps
//@route GET api/v1/bootcamps
//@access Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

//@desc Get single Bootcamp
//@route GET api/v1/bootcamps/:id
//@access Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp with ${req.params.id} not found`, 404)
    );
  }

  res.status(200).json({ success: true, data: bootcamp });
});

//@desc Create new Bootcamp
//@route POST api/v1/bootcamps
//@access Private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
  //Add user to req.body
  req.body.user = req.user.id;

  // Publisher can only add one Bootcamp where as a user can add many

  //Check for published Bootcamp
  const publisherBootcamp = await Bootcamp.findOne({ user: req.user.id });

  //If the user is not an admin they can only add one bootcamp
  if (publisherBootcamp && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `The user ${req.user.id} has already published  a bootcamp`,
        400
      )
    );
  }

  bootcamp = await Bootcamp.create(req.body);

  res.status(201).json({ success: true, data: bootcamp });
});

//@desc Update Bootcamp
//@route PUT api/v1/bootcamps/:id
//@access Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
  let bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp  not found with id of ${req.params.id}`, 404)
    );
  }

  //User Authorization for Bootcamp Owner (only the bootcamp owner can edit or delete the bootcamp)
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this bootcamp`,
        401
      )
    );
  }

  bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: bootcamp });
});

//@desc Delete single Bootcamp
//@route DELETE api/v1/bootcamps/:id
//@access Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp  not found with id of ${req.params.id}`, 404)
    );
  }

  //User Authorization for Bootcamp Owner (only the bootcamp owner can edit or delete the bootcamp)
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this bootcamp`,
        401
      )
    );
  }

  bootcamp.remove();

  res.status(200).json({ success: true, data: bootcamp });
});

//@desc Get Bootcamps within a radius
//@route GET /api/v1/bootcamps/radius/:zipcode/:distance
//@access Private
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  //get the lat and lng from geocoder
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  //calculate the radius using radians
  //Earth radius - 3963 miles
  const radius = distance / 3963;

  const bootcamps = await Bootcamp.find({
    location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res
    .status(200)
    .json({ success: true, count: bootcamps.length, data: bootcamps });
});

// @desc Upload photo for a bootcamp
// @route PUT /api/v1/bootcamps/:id/photo
// @access Private
exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
  bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp  not found with id of ${req.params.id}`, 404)
    );
  }

  if (!req.files) {
    return next(new ErrorResponse(`Please upload a  file`, 404));
  }

  let file = req.files.file;

  //Check for image file only
  if (!file.mimetype.startsWith('image/')) {
    return next(
      new ErrorResponse(`Please upload image (jpeg,jpg,png) file only`, 400)
    );
  }

  //Check for file size
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Please upload image file less than ${process.env.MAX_FILE_UPLOAD}`,
        400
      )
    );
  }

  //Custom Filename to avoid name overlap
  file.name = `bootcamp_photo_${bootcamp._id}${path.parse(file.name).ext}`;
  const uploadUrl = `${process.env.FILE_UPLOAD_PATH}/${file.name}`;

  file.mv(uploadUrl, async (error) => {
    if (error) {
      console.log(error);
      return next(new ErrorResponse(`Problem with image upload`, 500));
    }
  });

  await Bootcamp.findByIdAndUpdate(req.params.id, { photo: uploadUrl });

  res.status(200).json({ success: true, data: file.name });
});
