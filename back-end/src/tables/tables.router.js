const router = require("express").Router();
const controller = require("./tables.controller");
const methodNotAllowed = require("../errors/methodNotAllowed");

router
  .route("/:table_id/seat")
  .put(controller.occupyTable)
  .delete(controller.freeTable)
  .all(methodNotAllowed);

router
  .route("/")
  .get(controller.list)
  .post(controller.createTable)
  .all(methodNotAllowed);

module.exports = router;