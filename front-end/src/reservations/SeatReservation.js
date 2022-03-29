import React, { useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import ErrorAlert from "../layout/ErrorAlert";
import { listReservations, seatTable } from "../utils/api";

export default function SeatReservation({ tables, loadDashboard }) {
  const history = useHistory();

  //dynamic variables we want to keep track of
  const [reservations, setReservations] = useState([]);
  const [reservationsApiError, setReservationsApiError] = useState(null);
  const [table_id, setTableId] = useState(0);
  const [errors, setErrors] = useState([]);
  const [apiErrors, setApiErrors] = useState(null);

  //this stores the reservation we are wanting to seat in a variable so we can change it's status once seated
  const { reservation_id } = useParams();
  const foundReservation = reservations.find(
    (reservation) => reservation.reservation_id === Number(reservation_id)
  );

  //make an API call to retrieve all reservations on first render, which the above .find() uses to find our reservation
  useEffect(() => {
    const abortController = new AbortController();
    setReservationsApiError(null);

    listReservations(null, abortController.abort())
      .then(setReservations)
      .catch(setReservationsApiError);

    return () => abortController.abort();
  }, []);

  //if there are either no tables or no reservations returned by the API, do not render
  if (!tables || !reservations) return null;

  //called when user interacts with an input to store the data in a variable that we can use
  function handleChange({ target }) {
    setTableId(target.value);
  }

  //called when the form is submitted, handles the API call and re-renders the dashboard
  async function handleSubmit(event) {
    event.preventDefault();
    const abortController = new AbortController();

    //if check to call validation function, returns true or false
    if (validateSeat()) {
      //* API call here
      await seatTable(reservation_id, table_id, abortController.signal)
        .then(loadDashboard)
        .then(() =>
          history.push(`/dashboard?date=${foundReservation.reservation_date}`)
        )
        .catch(setApiErrors);
    }

    return () => abortController.abort();
  }

  //validation funtion to ensure the table exists and is available
  function validateSeat() {
    const foundErrors = [];

    // this find() iterates through the {tables} prop to store the table the user submitted
    const foundTable = tables.find(
      (table) => table.table_id === Number(table_id)
    );

    if (!foundTable) {
      foundErrors.push("The table you selected does not exist.");
    } else if (!foundReservation) {
      foundErrors.push({ message: "This reservation does not exist." });
    } else {
      if (foundTable.status === "occupied") {
        foundErrors.push({
          message: "The table you selected is currently occupied.",
        });
      }

      if (foundTable.capacity < foundReservation.people) {
        foundErrors.push({
          message: `The table you selected cannot seat ${foundReservation.people} people.`,
        });
      }
    }

    if (foundErrors.length > 0) setErrors(foundErrors);

    // this conditional will either return true or false based off of whether foundErrors is equal to 0
    return foundErrors.length === 0;
  }

  //function that iterates through { tables } and formats it for the table selector on the seat reservations page
  function availableTables() {
    return tables.map((table, index) => (
      <option key={table.table_id} value={table.table_id}>
        {table.table_name} - {table.capacity}
      </option>
    ));
  }

  //map all found frontend validation errors into an array of ErrorAlert modules to be rendered  conditionally
  function errorsJSX() {
    return errors.map((error, index) => (
      <ErrorAlert error={error} />
    ));
  }

  return (
    <div>
      <form>
        {errorsJSX()}
        <ErrorAlert error={reservationsApiError} />
        <ErrorAlert error={apiErrors} />

        <label htnlfor="table_id" className="h3 p-1">Choose table to seat reservation</label>
       
        <div className="p-1">
          <select
            className="form-select p-1"
            name="table_id"
            id="table_id"
            value={table_id}
            onChange={handleChange}
          >
            <option value={0}>Select a Table</option>
            {availableTables()}
          </select>
        </div>

        <div className="btn-group pt-3 p-1">
          <button
            className="btn btn-success"
            type="submit"
            onClick={handleSubmit}
          >
            Submit
          </button>

          <button
            className="btn btn-danger"
            type="button"
            onClick={history.goBack}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}