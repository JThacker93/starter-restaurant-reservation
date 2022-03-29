const service = require("./tables.service");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");

async function list(req, res) {
  const data = await service.list();
  res.json({ data });
}

async function validateReservationId(req, res, next) {
  const { reservation_id } = req.body.data;

  if (!reservation_id) {
    return next({
      status: 400,
      message: `reservation_id field must be included in the body`,
    });
  }

  const reservation = await service.readReservation(Number(reservation_id));

  if (!reservation) {
    return next({
      status: 404,
      message: `reservation_id ${reservation_id} does not exist`,
    });
  }

  res.locals.reservation = reservation;

  next();
}

async function validateTableId(req, res, next) {
  const { table_id } = req.params;
  const table = await service.readTable(table_id);

  if (!table) {
    return next({
      status: 404,
      message: `table id ${table_id} does not exist`,
    });
  }

  res.locals.table = table;

  next();
}

async function validateData(req, res, next) {
  if (!req.body.data) {
    return next({ status: 400, message: "Body must include a data object" });
  }

  next();
}

async function validateBody(req, res, next) {
  if (!req.body.data.table_name || req.body.data.table_name === "") {
    return next({ status: 400, message: "'table_name' field cannot be empty" });
  }

  if (req.body.data.table_name.length < 2) {
    return next({
      status: 400,
      message: "'table_name' field must be at least 2 characters",
    });
  }

  if (!req.body.data.capacity || req.body.data.capacity === "") {
    return next({ status: 400, message: "'capacity' field cannot be empty" });
  }

  if (typeof req.body.data.capacity !== "number") {
    return next({ status: 400, message: "'capacity' field must be a number" });
  }

  if (req.body.data.capacity < 1) {
    return next({
      status: 400,
      message: "'capacity' field must be at least 1",
    });
  }

  next();
}

async function validateSeat(req, res, next) {
  if (res.locals.table.status === "occupied") {
    return next({
      status: 400,
      message: "the table you selected is currently occupied",
    });
  }

  if (res.locals.reservation.status === "seated") {
    return next({
      status: 400,
      message: "this reservation is already seated to a table",
    });
  }

  if (res.locals.table.capacity < res.locals.reservation.people) {
    return next({
      status: 400,
      message: `the table you selected does not have enough capacity to seat ${res.locals.reservation.people} people`,
    });
  }

  next();
}

async function validateOccupiedTable(req, res, next) {
  if (res.locals.table.status !== "occupied") {
    return next({
      status: 400,
      message: "Selected table is not occupied.",
    });
  }

  next();
}

async function occupyTable(req, res) {
  await service.occupyTable(
    res.locals.table.table_id,
    res.locals.reservation.reservation_id
  );
  await service.updateReservation(
    res.locals.reservation.reservation_id,
    "seated"
  );

  res.status(200).json({ data: { status: "seated" } });
}

async function createTable(req, res) {
  if (req.body.data.reservation_id) {
    req.body.data.status = "occupied";
    await service.updateReservation(req.body.data.reservation_id, "seated");
  } else {
    req.body.data.status = "free";
  }

  const response = await service.createTable(req.body.data);

  res.status(201).json({ data: response[0] });
}

async function freeTable(req, res) {
  await service.updateReservation(res.locals.table.reservation_id, "finished");
  await service.freeTable(res.locals.table.table_id);

  res.status(200).json({ data: { status: "finsished" } });
}

module.exports = {
  list: [asyncErrorBoundary(list)],

  createTable: [
    asyncErrorBoundary(validateData),
    asyncErrorBoundary(validateBody),
    asyncErrorBoundary(createTable),
  ],

  occupyTable: [
    asyncErrorBoundary(validateData),
    asyncErrorBoundary(validateTableId),
    asyncErrorBoundary(validateReservationId),
    asyncErrorBoundary(validateSeat),
    asyncErrorBoundary(occupyTable),
  ],

  freeTable: [
    asyncErrorBoundary(validateTableId),
    asyncErrorBoundary(validateOccupiedTable),
    asyncErrorBoundary(freeTable),
  ],
};