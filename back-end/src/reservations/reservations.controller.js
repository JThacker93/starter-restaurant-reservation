const service = require("./reservations.service");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");

//makes sure the data  sent from the request exists
async function validateDataExists(req, res, next) {
  if (!req.body.data) {
    return next({ status: 400, message: "Body must include a data object" });
  }

  next();
}

//makes sure the data properties in the body are what we expect them to be
function validateRequiredProperties(req, res, next) {
  const reservation = req.body.data;
  const REQUIRED_FIELDS = [
    "first_name",
    "last_name",
    "mobile_number",
    "people",
    "reservation_date",
    "reservation_time",
  ];

  for (const field of REQUIRED_FIELDS) {
    if (!reservation.hasOwnProperty(field) || reservation[field] === "") {
      return next({
        status: 400,
        message: `Field required: '${field}'`,
      });
    }
  }

  if (
    Number.isNaN(
      Date.parse(
        `${req.body.data.reservation_date} ${req.body.data.reservation_time}`
      )
    )
  ) {
    return next({
      status: 400,
      message:
        "'reservation_date' or 'reservation_time' field is in an incorrect format",
    });
  }

  if (typeof reservation.people !== "number") {
    return next({
      status: 400,
      message: "Reservation cannot be made: 'people' field must be a number",
    });
  }

  if (reservation.people <= 0) {
    return next({
      status: 400,
      message: "Reservation cannot be made: 'people' field must be at least 1",
    });
  }

  if (reservation.status && reservation.status !== "booked") {
    return next({
      status: 400,
      message: `'status' field cannot be ${reservation.status}`,
    });
  }

  next();
}

//makes sure that a reservation that's being requested exists
async function validateReservationId(req, res, next) {
  const { reservation_id } = req.params;
  const reservation = await service.read(Number(reservation_id));
  if (!reservation) {
    return next({
      status: 404,
      message: `reservation_id ${reservation_id} does not exist`,
    });
  }

  res.locals.reservation = reservation;

  next();
}

//makes sure the data sent in from the request matches the restaurants rules for reservations
async function validateReservationDate(req, res, next) {
  const { reservation_date, reservation_time} = req.body;
  const todaysDate = new Date();
  const reserveDate = new Date(`${reservation_date}T${reservation_time}`);
  
  if (reserveDate.getDay() === 2) {
    return next({
      status: 400,
      message: "'reservation_date' field: restauraunt is closed on tuesday",
    });
  }

  if (Date.parse(reserveDate) <= Date.parse(todaysDate))
    return next({
      status: 400,
      message: `Your reservation cannot be made for a date or time of the past. Please select a future date.`,
    });

    next()
  }

//verifies that the status of the reservation  in a update request allows it to be updated, i.e. it's
//not already a finished table
async function validateUpdateBody(req, res, next) {
  const reservation = req.body.data;
  const VALID_STATUSES = ["booked", "seated", "finished", "cancelled"];

  if (!reservation.status) {
    next({
      status: 400,
      message: "body must include a status field",
    });
  }

  if (!VALID_STATUSES.includes(reservation.status)) {
    next({
      status: 400,
      message: `invalid reservation status: ${reservation.status}`,
    });
  }

  if (res.locals.reservation.status === "finished") {
    next({
      status: 400,
      message: "A finished reservation cannot be updated",
    });
  }

  next();
}

//return a list of all reservations from db
async function list(req, res) {
  let { date = null } = req.query;
  let { mobile_number = null } = req.query;

  const reservations = await service.list(date, mobile_number);

  const response = reservations.filter((res) => res.status !== "finished");

  res.json({ data: response });
}

//returns a specific reservation from db
async function read(req, res) {
  res.status(200).json({ data: res.locals.reservation });
}

//creates a new reservation in the db with the data from the request
async function create(req, res) {
  const response = await service.create(req.body.data);
  res.status(201).json({ data: response });
}

//updates a reservation's status with the status that was sent in the update request
async function updateReservationStatus(req, res) {
  await service.updateReservationStatus(
    res.locals.reservation.reservation_id,
    req.body.data.status
  );
  res.status(200).json({ data: { status: req.body.data.status } });
}

async function editReservation(req, res) {
  const response = await service.editReservation(
    res.locals.reservation.reservation_id,
    req.body.data
  );
  res.status(200).json({ data: response });
}

module.exports = {
  list: asyncErrorBoundary(list),

  read: [asyncErrorBoundary(validateReservationId), asyncErrorBoundary(read)],

  create: [
    asyncErrorBoundary(validateDataExists),
    asyncErrorBoundary(validateRequiredProperties),
    asyncErrorBoundary(validateReservationDate),
    asyncErrorBoundary(create),
  ],

  updateReservationStatus: [
    asyncErrorBoundary(validateDataExists),
    asyncErrorBoundary(validateReservationId),
    asyncErrorBoundary(validateUpdateBody),
    asyncErrorBoundary(updateReservationStatus),
  ],

  editReservation: [
    asyncErrorBoundary(validateDataExists),
    asyncErrorBoundary(validateReservationId),
    asyncErrorBoundary(validateRequiredProperties),
    asyncErrorBoundary(validateReservationDate),
    asyncErrorBoundary(editReservation),
  ],
};